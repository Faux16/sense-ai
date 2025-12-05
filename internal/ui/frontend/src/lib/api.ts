const API_BASE = 'http://localhost:8080';

export const api = {
    async getFindings() {
        const res = await fetch(`${API_BASE}/findings`);
        if (!res.ok) throw new Error('Failed to fetch findings');
        const data = await res.json();
        return data || [];
    },

    createEventSource() {
        return new EventSource(`${API_BASE}/stream`);
    },
};
