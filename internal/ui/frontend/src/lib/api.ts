import { Finding } from '../types';

const API_BASE = 'http://localhost:8080';

export const api = {
    async getFindings(): Promise<Finding[]> {
        const res = await fetch(`${API_BASE}/findings`);
        if (!res.ok) throw new Error('Failed to fetch findings');

        const data = await res.json();
        return data || [];
 main
    },

    createEventSource(): EventSource {
        return new EventSource(`${API_BASE}/stream`);
    },

    async getGatewayConfig() {
        const res = await fetch(`${API_BASE}/config/gateway`);
        if (!res.ok) throw new Error('Failed to fetch gateway config');
        return res.json();
    },

    async saveGatewayConfig(config: any) {
        const res = await fetch(`${API_BASE}/config/gateway`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error('Failed to save gateway config');
        return res.json();
    },

    async getPolicies() {
        const res = await fetch(`${API_BASE}/config/policies`);
        if (!res.ok) throw new Error('Failed to fetch policies');
        return res.json();
    },

    async savePolicies(policies: any[]) {
        const res = await fetch(`${API_BASE}/config/policies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(policies),
        });
        if (!res.ok) throw new Error('Failed to save policies');
        return res.json();
    }
};
