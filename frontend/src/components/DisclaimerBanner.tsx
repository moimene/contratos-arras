import React from 'react';
import { DISCLAIMER_BANNER } from '../constants/disclaimers';

export default function DisclaimerBanner() {
    return (
        <div
            style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                color: '#856404',
                fontSize: '14px',
                lineHeight: '1.5',
                fontWeight: 500,
            }}
        >
            {DISCLAIMER_BANNER}
        </div>
    );
}
