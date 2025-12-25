import crypto from 'crypto';

const OKTA_TOKEN_URL = process.env.QTSP_OKTA_URL || 'https://legalappfactory.okta.com/oauth2/aus653dgdgTFL2mhw417/v1/token';
const API_BASE_URL = process.env.QTSP_API_URL || 'https://api.pre.gcloudfactory.com/digital-trust';

interface AuthToken {
    access_token: string;
    expires_at: number; // timestamp in ms
}

interface EvidenceInfo {
    status: {
        status: 'PENDING' | 'COMPLETED' | 'ERROR';
        tspTimestamp?: {
            token?: string;
        };
        [key: string]: any;
    };
    timestamps?: {
        tspTimestamps?: Record<string, {
            token: string;
            timestampedAt: string;
        }>;
    };
    [key: string]: any;
}

let cachedToken: AuthToken | null = null;
let cachedSystemIds: { caseFileId: string; groupId: string } | null = null;

function getCredentials() {
    const clientId = process.env.QTSP_CLIENT_ID;
    const clientSecret = process.env.QTSP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('QTSP credentials (QTSP_CLIENT_ID, QTSP_CLIENT_SECRET) are not configured.');
    }

    return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
        return cachedToken.access_token;
    }

    console.log('QTSP: Refreshing access token...');
    const { clientId, clientSecret } = getCredentials();

    // Construct URL with query parameters as per provided curl example and docs
    const url = new URL(OKTA_TOKEN_URL);
    url.searchParams.append('grant_type', 'client_credentials');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('client_secret', clientSecret);
    url.searchParams.append('scope', 'token');

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    if (!response.ok) {
        const text = await response.text();
        const errorMsg = `Failed to get access token: ${response.status} ${text}`;
        console.error('QTSP Auth Error:', errorMsg);
        throw new Error(errorMsg);
    }

    const data = await response.json() as any;
    cachedToken = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in * 1000)
    };
    console.log('QTSP: Access token refreshed successfully.');

    return cachedToken.access_token;
}

async function ensureSystemResources(): Promise<{ caseFileId: string; groupId: string }> {
    if (cachedSystemIds) return cachedSystemIds;

    const caseFileId = process.env.QTSP_CASE_FILE_ID;
    const groupId = process.env.QTSP_GROUP_ID;

    if (!caseFileId || !groupId) {
        throw new Error('QTSP System Resources (QTSP_CASE_FILE_ID, QTSP_GROUP_ID) are not configured.');
    }

    cachedSystemIds = { caseFileId, groupId };
    return cachedSystemIds;
}

export async function createTimestampEvidence(hash: string): Promise<{ token: string; timestamp: string }> {
    const { caseFileId, groupId } = await ensureSystemResources();
    const token = await getAccessToken();
    const evidenceId = crypto.randomUUID();
    const capturedAt = new Date().toISOString();

    console.log(`QTSP: Creating timestamp evidence [${evidenceId}] for hash ${hash.substring(0, 8)}...`);

    const body = {
        id: evidenceId,
        evidenceId: evidenceId,
        hash: hash,
        title: `Timestamp Request ${capturedAt}`,
        capturedAt: capturedAt,
        custodyType: 'EXTERNAL',
        testimony: {
            TSP: {
                required: true,
                providers: ['EADTrust']
            }
        }
    };

    const createRes = await fetch(`${API_BASE_URL}/api/v1/private/case-files/${caseFileId}/evidence-groups/${groupId}/evidences`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!createRes.ok) {
        const errText = await createRes.text();
        const errorMsg = `Failed to create Evidence: ${createRes.status} ${errText}`;
        console.error('QTSP Evidence Creation Error:', errorMsg);
        throw new Error(errorMsg);
    }

    // Poll for status
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const getRes = await fetch(`${API_BASE_URL}/api/v1/private/case-files/${caseFileId}/evidence-groups/${groupId}/evidences/${evidenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!getRes.ok) continue;

        const info = await getRes.json() as EvidenceInfo;

        if (info.status.status === 'COMPLETED' || (info.timestamps?.tspTimestamps && Object.keys(info.timestamps.tspTimestamps).length > 0)) {
            if (info.timestamps?.tspTimestamps) {
                const keys = Object.keys(info.timestamps.tspTimestamps);
                if (keys.length > 0) {
                    const firstTsp = info.timestamps.tspTimestamps[keys[0]];
                    console.log(`QTSP: Timestamp obtained for evidence [${evidenceId}]`);
                    return {
                        token: firstTsp.token,
                        timestamp: firstTsp.timestampedAt
                    };
                }
            }
        } else if (info.status.status === 'ERROR') {
             console.error(`QTSP Evidence [${evidenceId}] failed status: ${JSON.stringify(info.status)}`);
             throw new Error(`Evidence processing failed: ${JSON.stringify(info.status)}`);
        }

        attempts++;
    }

    console.error(`QTSP: Timeout waiting for timestamp for evidence [${evidenceId}]`);
    throw new Error('Timeout waiting for QTSP timestamp');
}
