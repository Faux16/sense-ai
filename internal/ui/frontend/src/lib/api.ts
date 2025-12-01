import { Finding } from '../types';

const API_BASE = 'http://localhost:8080';

export const api = {
    async getFindings(): Promise<Finding[]> {
        const res = await fetch(`${API_BASE}/findings`);
        if (!res.ok) throw new Error('Failed to fetch findings');
        return res.json() as Promise<Finding[]>;
    },

    createEventSource(): EventSource {
        return new EventSource(`${API_BASE}/stream`);
    },
};
