import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Shield, CheckCircle, AlertTriangle, Plus, Save, Trash2, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api';

interface PolicyRule {
    name: string;
    description: string;
    target: string;
    match: string[];
    action: string;
    severity: number;
    json_key?: string;
}

export default function PoliciesView() {
    const [policies, setPolicies] = useState<PolicyRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Temp state for editing
    const [editPolicies, setEditPolicies] = useState<PolicyRule[]>([]);

    const fetchPolicies = () => {
        setLoading(true);
        api.getPolicies()
            .then(data => {
                setPolicies(data || []);
                setEditPolicies(data || []);
                setError(null);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleSave = () => {
        setSaving(true);
        api.savePolicies(editPolicies)
            .then(() => {
                setPolicies(editPolicies);
                setIsEditing(false);
                alert('Policies saved successfully!');
            })
            .catch(err => alert('Failed to save: ' + err.message))
            .finally(() => setSaving(false));
    };

    const addPolicy = () => {
        const newPolicy: PolicyRule = {
            name: "New Policy",
            description: "Description of the policy",
            target: "json_body",
            match: ["keyword"],
            action: "alert",
            severity: 0.5,
            json_key: "messages"
        };
        setEditPolicies([...editPolicies, newPolicy]);
    };

    const removePolicy = (index: number) => {
        const newD = [...editPolicies];
        newD.splice(index, 1);
        setEditPolicies(newD);
    };

    const updatePolicy = (index: number, field: keyof PolicyRule, value: any) => {
        const newD = [...editPolicies];
        newD[index] = { ...newD[index], [field]: value };
        setEditPolicies(newD);
    };

    const updateMatch = (pIndex: number, str: string) => {
        const newD = [...editPolicies];
        // Split by comma
        newD[pIndex].match = str.split(',').map(s => s.trim()).filter(s => s !== "");
        setEditPolicies(newD);
    };

    if (loading && !policies.length) return <div className="p-8 text-center text-gray-400">Loading Policies...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;

    const activeList = isEditing ? editPolicies : policies;

    // Derived stats
    const totalPolicies = policies.length;
    const blockPolicies = policies.filter(p => p.action === 'block').length;

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Total Policies</div>
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">{totalPolicies}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Blocking Rules</div>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-red-400">{blockPolicies}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Status</div>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-400">Active</div>
                    </CardContent>
                </Card>
            </div>

            {/* Policies List / Editor */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Policy Management
                    </CardTitle>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => { setEditPolicies(policies); setIsEditing(true); }}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                            >
                                Edit Policies
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={addPolicy}
                                    className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditPolicies(policies); }}
                                    className="px-3 py-1 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {activeList.map((policy, i) => (
                            <div key={i} className="p-4 rounded-lg bg-gray-900 border border-gray-800 relative group">
                                {isEditing && (
                                    <button
                                        onClick={() => removePolicy(i)}
                                        className="absolute top-2 right-2 text-gray-600 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Name</label>
                                                <input
                                                    className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm"
                                                    value={policy.name}
                                                    onChange={(e) => updatePolicy(i, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Description</label>
                                                <input
                                                    className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm"
                                                    value={policy.description}
                                                    onChange={(e) => updatePolicy(i, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Target</label>
                                                <select
                                                    className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm"
                                                    value={policy.target}
                                                    onChange={(e) => updatePolicy(i, 'target', e.target.value)}
                                                >
                                                    <option value="network">Network (Domain/IP)</option>
                                                    <option value="json_body">JSON Payload</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Match Keywords (comma separated)</label>
                                                <textarea
                                                    className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm min-h-[60px]"
                                                    value={policy.match?.join(', ')}
                                                    onChange={(e) => updateMatch(i, e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500">Action</label>
                                                    <select
                                                        className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm"
                                                        value={policy.action}
                                                        onChange={(e) => updatePolicy(i, 'action', e.target.value)}
                                                    >
                                                        <option value="alert">Alert</option>
                                                        <option value="block">Block</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500">Severity (0-1)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="w-full bg-gray-800 border-gray-700 rounded px-2 py-1 text-white text-sm"
                                                        value={policy.severity}
                                                        onChange={(e) => updatePolicy(i, 'severity', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-white">{policy.name}</h3>
                                                <p className="text-sm text-gray-400">{policy.description}</p>
                                            </div>
                                            <Badge className={policy.action === 'block' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                                                {policy.action.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            {policy.match?.map((m, k) => (
                                                <span key={k} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700 font-mono">
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Target: <span className="text-indigo-400">{policy.target}</span> • Key: {policy.json_key || 'N/A'} • Severity: {policy.severity}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
