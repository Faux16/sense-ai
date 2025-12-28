import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { api } from '../lib/api';
import { Save, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function GatewayConfigEditor() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = () => {
        setLoading(true);
        api.getGatewayConfig()
            .then(data => {
                setConfig(data);
                setError(null);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = () => {
        setSaving(true);
        api.saveGatewayConfig(config)
            .then(() => {
                alert('Configuration saved successfully!');
            })
            .catch(err => alert('Failed to save: ' + err.message))
            .finally(() => setSaving(false));
    };

    const addRoute = () => {
        if (!config) return;
        const newRoute = { path: "/new/path/", target: "https://api.example.com", provider: "openai" };
        setConfig({ ...config, routes: [...(config.routes || []), newRoute] });
    };

    const removeRoute = (index: number) => {
        if (!config) return;
        const newRoutes = [...config.routes];
        newRoutes.splice(index, 1);
        setConfig({ ...config, routes: newRoutes });
    };

    const updateRoute = (index: number, field: string, value: string) => {
        if (!config) return;
        const newRoutes = [...config.routes];
        newRoutes[index] = { ...newRoutes[index], [field]: value };
        setConfig({ ...config, routes: newRoutes });
    };

    if (loading) return <div className="text-gray-400 p-4">Loading configuration...</div>;
    if (error) return <div className="text-red-400 p-4">Error loading config: {error}</div>;
    if (!config) return null;

    return (
        <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Gateway Configuration
                </CardTitle>
                <div className="flex gap-2">
                    <button onClick={fetchConfig} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Server Settings */}
                <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Server Port</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">Port:</span>
                        <input
                            type="number"
                            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-24"
                            value={config.server?.port || 8081}
                            onChange={(e) => setConfig({ ...config, server: { ...config.server, port: parseInt(e.target.value) } })}
                        />
                    </div>
                </div>

                {/* Routes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">Routing Rules</h3>
                        <button onClick={addRoute} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                            <Plus className="w-3 h-3" /> Add Route
                        </button>
                    </div>

                    {config.routes?.map((route: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-gray-900 border border-gray-800 space-y-3 relative group">
                            <button
                                onClick={() => removeRoute(i)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Path Prefix</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm font-mono"
                                        value={route.path}
                                        onChange={(e) => updateRoute(i, 'path', e.target.value)}
                                        placeholder="/v1/"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Target URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm font-mono"
                                        value={route.target}
                                        onChange={(e) => updateRoute(i, 'target', e.target.value)}
                                        placeholder="https://api.openai.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Provider</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                                        value={route.provider}
                                        onChange={(e) => updateRoute(i, 'provider', e.target.value)}
                                        placeholder="openai"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
