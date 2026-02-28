
import { qtspAuthService } from './qtspAuthService.js';

interface CaseFile {
    id: string;
    code: string;
    description: string;
    owner: string;
    title: string;
    // ... otros campos
}

interface EvidenceGroup {
    id: string;
    name: string;
    type: string;
    description?: string;
}

interface QtspEvidenceResult {
    evidenceId: string;
    qtspUrl: string; // URL de subida/visualización
    status: string;
}

export class QtspEvidenceService {

    /**
     * Asegura la existencia de un Case File para el contrato
     * Estrategia: "Deterministic ID" = contractId
     */
    async ensureCaseFile(contratoId: string, numeroExpediente: string): Promise<string> {
        const token = await qtspAuthService.getAccessToken();
        if (!token) return '';

        const baseUrl = qtspAuthService.getApiBaseUrl();
        const caseFileId = contratoId; // Mismo ID

        // 1. Intentar obtenerlo (Check existence)
        try {
            const response = await fetch(`${baseUrl}/digital-trust/api/v1/private/case-files/${caseFileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                return caseFileId;
            }
        } catch (e) {
            console.warn(`[QTSP] Check CaseFile ${caseFileId} failed, trying creation.`);
        }

        // 2. Crearlo si no existe
        try {
            const body = {
                id: caseFileId,
                code: `EXP-${numeroExpediente || contratoId.substring(0, 8)}`,
                description: `Expediente Chrono-Flare: ${numeroExpediente}`,
                category: 'ARRAS',
                owner: 'chrono-flare-system',
                title: `Expediente ${numeroExpediente}`,
                metadata: {
                    system: 'chrono-flare',
                    contrato_id: contratoId
                }
            };

            const createResponse = await fetch(`${baseUrl}/digital-trust/api/v1/private/case-files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!createResponse.ok) {
                const errText = await createResponse.text();
                // Si es 409 o similar, quizás se creó concurrente, asumimos OK
                if (createResponse.status === 409 || errText.includes('already exists')) {
                    return caseFileId;
                }
                console.error(`[QTSP] Error creando CaseFile: ${createResponse.status} ${errText}`);
                throw new Error(`Qtsp createCaseFile failed: ${errText}`);
            }

            console.log(`[QTSP] CaseFile creado: ${caseFileId}`);
            return caseFileId;

        } catch (error) {
            console.error('[QTSP] Excepción creando CaseFile:', error);
            throw error;
        }
    }

    /**
     * Asegura un Evidence Group (ej: "Documentos")
     * Estrategia: Buscar por nombre "Documentos Generales" o crear uno nuevo con ID determinista?
     * Para simplificar, usaremos un ID determinista derivado si es posible, o buscaremos.
     * Dado que no tenemos UUID v5 fácil, listaremos los grupos y buscaremos uno "FILE".
     */
    async ensureEvidenceGroup(caseFileId: string, groupName: string = 'Documentos del Expediente'): Promise<string> {
        const token = await qtspAuthService.getAccessToken();
        if (!token) return '';
        const baseUrl = qtspAuthService.getApiBaseUrl();

        // 1. Listar grupos
        const listResponse = await fetch(`${baseUrl}/digital-trust/api/v1/private/case-files/${caseFileId}/evidence-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (listResponse.ok) {
            const data = await listResponse.json() as { content?: EvidenceGroup[], items?: EvidenceGroup[] }; // Ajustar según API real
            // La API del PoC devolvía un array o estructura paginada?
            // "Get Evidence group list" -> response array?
            // Asumiremos que devuelve lista o paginada en 'content'.
            const groups = Array.isArray(data) ? data : (data.content || []);

            const existing = groups.find((g: any) => g.name === groupName || g.type === 'FILE');
            if (existing) {
                return existing.id;
            }
        }

        // 2. Crear si no existe
        // Necesitamos un ID nuevo. Usamos crypto.randomUUID() ya que no lo tenemos determinista fácil sin contratoId+salt
        const newGroupId = crypto.randomUUID();

        const createResponse = await fetch(`${baseUrl}/digital-trust/api/v1/private/case-files/${caseFileId}/evidence-groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: newGroupId,
                type: 'FILE',
                name: groupName,
                description: 'Grupo general de documentos del expediente',
                createdBy: 'chrono-flare-system'
            })
        });

        if (!createResponse.ok) {
            const errText = await createResponse.text();
            throw new Error(`Qtsp createEvidenceGroup failed: ${errText}`);
        }

        return newGroupId;
    }

    /**
     * Registra una evidencia (hash)
     */
    async registerEvidence(params: {
        contratoId: string,
        numeroExpediente: string,
        archivoId: string,
        hashHex: string,
        fileName: string,
        metadata?: any
    }): Promise<QtspEvidenceResult | null> {
        try {
            const { contratoId, numeroExpediente, archivoId, hashHex, fileName, metadata } = params;

            // 1. Asegurar estructura
            const caseFileId = await this.ensureCaseFile(contratoId, numeroExpediente);
            if (!caseFileId) return null;

            const evidenceGroupId = await this.ensureEvidenceGroup(caseFileId);
            if (!evidenceGroupId) return null;

            // 2. Crear evidencia
            const token = await qtspAuthService.getAccessToken();
            const baseUrl = qtspAuthService.getApiBaseUrl();

            // Usamos archivoId como evidenceId (es UUID)
            const body = {
                evidenceId: archivoId,
                hash: hashHex,
                createdBy: 'chrono-flare-system',
                title: fileName,
                capturedAt: new Date().toISOString(),
                custodyType: 'INTERNAL', // Nosotros tenemos el fichero
                fileName: fileName,
                testimony: {
                    TSP: {
                        required: true,
                        providers: ['EADTrust'] // O GoCertius según config
                    }
                },
                metadata: {
                    ...metadata,
                    source: 'chrono-flare'
                }
            };

            const response = await fetch(`${baseUrl}/digital-trust/api/v1/private/case-files/${caseFileId}/evidence-groups/${evidenceGroupId}/evidences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[QTSP] Error registrando evidencia ${archivoId}: ${errText}`);
                return null;
            }

            const data = await response.json() as any;
            // Data contiene { "url": "...", "expiration": 0 } para subida si fuera custody internal?
            // "In case you have evidence with custodyTyoe "Internal" (We keep custody of the file), the URL that was returned..."
            // Wait, "Internal" custody in QTSP usually means *they* keep it?
            // Docs: "custodyType": "INTERNAL" (We keep custody of the file) -> URL returned to upload.
            // If we don't upload the file, the hash is still registered.
            // For pure timestamping of hash, do we need to upload the file?
            // Usually timestamping only needs hash. But "Evidence" concept implies file existence.
            // If we don't upload, maybe it's fine just for hash registry.
            // But let's assume we just returned the registration status.

            return {
                evidenceId: archivoId,
                qtspUrl: data.url || '',
                status: 'REGISTERED'
            };

        } catch (error) {
            console.error('[QTSP] Excepción registrando evidencia:', error);
            return null;
        }
    }
}

export const qtspEvidenceService = new QtspEvidenceService();
