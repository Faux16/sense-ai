import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Finding } from '../types';
import { Shield, CheckCircle, XCircle, TrendingUp, AlertTriangle, FileText, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PoliciesViewProps {
    findings: Finding[];
}

interface Policy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: string;
    rules: string[];
    violations: number;
    effectiveness: number;
    lastTriggered?: Date;
}

// Mock policies data (in real app, this would come from backend)
const mockPolicies: Policy[] = [
    {
        id: 'pol-001',
        name: 'Shadow AI Detection',
        description: 'Detects unauthorized AI/ML services and API calls',
        enabled: true,
        category: 'AI Security',
        rules: ['Detect OpenAI API calls', 'Monitor Anthropic endpoints', 'Track Hugging Face usage'],
        violations: 45,
        effectiveness: 92,
        lastTriggered: new Date(Date.now() - 1800000),
    },
    {
        id: 'pol-002',
        name: 'Network Anomaly Detection',
        description: 'Identifies unusual network traffic patterns',
        enabled: true,
        category: 'Network Security',
        rules: ['Monitor outbound connections', 'Detect port scanning', 'Track bandwidth spikes'],
        violations: 23,
        effectiveness: 87,
        lastTriggered: new Date(Date.now() - 3600000),
    },
    {
        id: 'pol-003',
        name: 'Data Exfiltration Prevention',
        description: 'Prevents unauthorized data transfers',
        enabled: true,
        category: 'Data Protection',
        rules: ['Monitor large file transfers', 'Track cloud storage uploads', 'Detect clipboard activity'],
        violations: 12,
        effectiveness: 95,
        lastTriggered: new Date(Date.now() - 7200000),
    },
    {
        id: 'pol-004',
        name: 'Endpoint Compliance',
        description: 'Ensures endpoints meet security standards',
        enabled: true,
        category: 'Compliance',
        rules: ['Check encryption status', 'Verify firewall enabled', 'Monitor software updates'],
        violations: 8,
        effectiveness: 78,
        lastTriggered: new Date(Date.now() - 10800000),
    },
    {
        id: 'pol-005',
        name: 'Unauthorized Access Detection',
        description: 'Detects suspicious authentication attempts',
        enabled: false,
        category: 'Access Control',
        rules: ['Monitor failed logins', 'Track privilege escalation', 'Detect brute force'],
        violations: 0,
        effectiveness: 0,
    },
];

export default function PoliciesView({ }: PoliciesViewProps) {
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [policies] = useState<Policy[]>(mockPolicies);

    // Calculate policy metrics
    const totalViolations = policies.reduce((sum, p) => sum + p.violations, 0);
    const activePolicies = policies.filter(p => p.enabled).length;
    const avgEffectiveness = policies.filter(p => p.enabled).reduce((sum, p) => sum + p.effectiveness, 0) / activePolicies || 0;
    const complianceScore = (activePolicies / policies.length) * 100;

    // Violation trend data (mock)
    const violationTrend = Array.from({ length: 7 }, (_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        violations: Math.floor(Math.random() * 20) + 5,
    }));

    // Policy effectiveness data
    const effectivenessData = policies
        .filter(p => p.enabled)
        .map(p => ({
            name: p.name.split(' ').slice(0, 2).join(' '),
            effectiveness: p.effectiveness,
        }));

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'AI Security': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Network Security': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Data Protection': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Compliance': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Access Control': 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Active Policies</div>
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">{activePolicies}</div>
                        <div className="text-xs text-gray-400 mt-1">of {policies.length} total</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Total Violations</div>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-red-400">{totalViolations}</div>
                        <div className="text-xs text-gray-400 mt-1">Detected issues</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Avg Effectiveness</div>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-400">{avgEffectiveness.toFixed(0)}%</div>
                        <div className="text-xs text-gray-400 mt-1">Across active policies</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Compliance Score</div>
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-purple-400">{complianceScore.toFixed(0)}%</div>
                        <div className="text-xs text-gray-400 mt-1">Policy coverage</div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Violation Trend (7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={violationTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="day" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Policy Effectiveness
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={effectivenessData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                <Bar dataKey="effectiveness" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Policies List */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Security Policies
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {policies.map((policy) => (
                            <div
                                key={policy.id}
                                onClick={() => setSelectedPolicy(policy)}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${policy.enabled
                                    ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/30'
                                    : 'bg-gray-900/50 border-gray-800/50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-white">{policy.name}</h3>
                                            {policy.enabled ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-gray-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2">{policy.description}</p>
                                        <Badge className={getCategoryColor(policy.category)}>
                                            {policy.category}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-800">
                                    <div>
                                        <div className="text-xs text-gray-400">Violations</div>
                                        <div className="text-lg font-bold text-red-400">{policy.violations}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Effectiveness</div>
                                        <div className="text-lg font-bold text-green-400">
                                            {policy.effectiveness > 0 ? `${policy.effectiveness}%` : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {policy.lastTriggered && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Last triggered: {policy.lastTriggered.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Policy Details Modal */}
            {selectedPolicy && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPolicy(null)}
                >
                    <Card
                        className="w-full max-w-2xl bg-black border-indigo-500/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-white">{selectedPolicy.name}</CardTitle>
                                        <p className="text-sm text-gray-400 mt-1">{selectedPolicy.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPolicy(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-gray-900">
                                    <div className="text-xs text-gray-400 mb-1">Status</div>
                                    <div className="flex items-center gap-2">
                                        {selectedPolicy.enabled ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                <span className="text-green-400 font-semibold">Enabled</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-500 font-semibold">Disabled</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-900">
                                    <div className="text-xs text-gray-400 mb-1">Category</div>
                                    <Badge className={getCategoryColor(selectedPolicy.category)}>
                                        {selectedPolicy.category}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Policy Rules
                                </h4>
                                <div className="space-y-2">
                                    {selectedPolicy.rules.map((rule, index) => (
                                        <div key={index} className="p-2 rounded bg-gray-900 text-sm text-gray-300 flex items-start gap-2">
                                            <span className="text-indigo-400">•</span>
                                            {rule}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <div className="text-xs text-gray-400 mb-1">Violations</div>
                                    <div className="text-2xl font-bold text-red-400">{selectedPolicy.violations}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="text-xs text-gray-400 mb-1">Effectiveness</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {selectedPolicy.effectiveness > 0 ? `${selectedPolicy.effectiveness}%` : 'N/A'}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                    <div className="text-xs text-gray-400 mb-1">Rules</div>
                                    <div className="text-2xl font-bold text-indigo-400">{selectedPolicy.rules.length}</div>
                                </div>
                            </div>

                            {selectedPolicy.lastTriggered && (
                                <div className="p-3 rounded-lg bg-gray-900">
                                    <div className="text-xs text-gray-400 mb-1">Last Triggered</div>
                                    <div className="text-sm text-white">{selectedPolicy.lastTriggered.toLocaleString()}</div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-800">
                                <div className="text-xs uppercase text-gray-400 mb-2">Recommendations</div>
                                <div className="space-y-2 text-sm text-gray-300">
                                    {selectedPolicy.violations > 20 && (
                                        <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                                            • High violation count - Review policy rules for false positives
                                        </div>
                                    )}
                                    {selectedPolicy.effectiveness < 80 && selectedPolicy.enabled && (
                                        <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400">
                                            • Low effectiveness - Consider refining detection rules
                                        </div>
                                    )}
                                    {!selectedPolicy.enabled && (
                                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                            • Policy is disabled - Enable to improve security coverage
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
