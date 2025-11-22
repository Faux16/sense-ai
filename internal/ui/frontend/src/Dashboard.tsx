import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Finding, SourceMetadata } from './types';
import { api } from './lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Shield, AlertTriangle, TrendingUp, X } from 'lucide-react';
import WorldMap from './components/WorldMap';


const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function Dashboard() {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
    const [filterModal, setFilterModal] = useState<{ open: boolean; title: string; findings: Finding[] }>({
        open: false,
        title: '',
        findings: [],
    });

    useEffect(() => {
        // Load initial findings
        api.getFindings().then(setFindings).catch(console.error);

        // Set up SSE for real-time updates
        const es = api.createEventSource();
        es.addEventListener('finding', (e: MessageEvent) => {
            const finding = JSON.parse(e.data);
            setFindings(prev => [...prev, finding]);
        });

        return () => es.close();
    }, []);

    const stats = {
        total: findings.length,
        critical: findings.filter(f => f.severity >= 0.8).length,
        policies: 5,
        rate: findings.filter(f => Date.now() - new Date(f.timestamp).getTime() < 60000).length,
    };

    const severityData = [
        { name: 'Low', value: findings.filter(f => f.severity < 0.5).length, fill: '#10b981', range: [0, 0.5] },
        { name: 'Medium', value: findings.filter(f => f.severity >= 0.5 && f.severity < 0.7).length, fill: '#f59e0b', range: [0.5, 0.7] },
        { name: 'High', value: findings.filter(f => f.severity >= 0.7 && f.severity < 0.8).length, fill: '#f97316', range: [0.7, 0.8] },
        { name: 'Critical', value: findings.filter(f => f.severity >= 0.8).length, fill: '#ef4444', range: [0.8, 1] },
    ];

    const typeData = [
        { name: 'Network', value: findings.filter(f => f.type === 'network').length, type: 'network' },
        { name: 'Endpoint', value: findings.filter(f => f.type === 'endpoint').length, type: 'endpoint' },
    ];

    const timelineData = findings.slice(-20).map((f, i) => ({
        index: i,
        severity: f.severity,
        finding: f,
    }));

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return 'text-red-400';
        if (severity >= 0.5) return 'text-orange-400';
        return 'text-green-400';
    };

    const getMetadata = (finding: Finding): SourceMetadata => {
        try {
            return JSON.parse(finding.source || '{}');
        } catch {
            return {};
        }
    };

    // Click handlers
    const handleStatClick = (type: 'all' | 'critical') => {
        if (type === 'all') {
            setFilterModal({ open: true, title: 'All Findings', findings });
        } else {
            const critical = findings.filter(f => f.severity >= 0.8);
            setFilterModal({ open: true, title: 'Critical Findings (Severity ≥ 0.8)', findings: critical });
        }
    };

    const handleSeverityClick = (data: any) => {
        const [min, max] = data.range;
        const filtered = findings.filter(f => f.severity >= min && f.severity < max);
        setFilterModal({ open: true, title: `${data.name} Severity Findings`, findings: filtered });
    };

    const handleTypeClick = (data: any) => {
        const filtered = findings.filter(f => f.type === data.type);
        setFilterModal({ open: true, title: `${data.name} Findings`, findings: filtered });
    };

    const handleTimelineClick = (data: any) => {
        if (data && data.finding) {
            setSelectedFinding(data.finding);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-900 bg-black/60 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                SENSE Platform
                            </h1>
                            <p className="text-xs text-gray-400">Shadow AI Protection & Governance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                            LIVE
                        </Badge>
                        <span className="text-sm text-gray-400">{new Date().toLocaleString()}</span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card onClick={() => handleStatClick('all')} className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Total Findings</span>
                                <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total}</div>
                            <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
                        </CardContent>
                    </Card>

                    <Card onClick={() => handleStatClick('critical')} className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Critical</span>
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="text-3xl font-bold text-red-400">{stats.critical}</div>
                            <div className="text-xs text-gray-400 mt-1">Severity ≥ 0.8</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Policies Active</span>
                                <Shield className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-3xl font-bold text-purple-400">{stats.policies}</div>
                            <div className="text-xs text-gray-400 mt-1">Loaded from config</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Detection Rate</span>
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="text-3xl font-bold text-green-400">{stats.rate.toFixed(1)}</div>
                            <div className="text-xs text-gray-400 mt-1">Per minute</div>
                        </CardContent>
                    </Card>
                </div>

                {/* World Map */}
                <div className="mb-6">
                    <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Live Global Traffic
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <WorldMap findings={findings} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Threat Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={timelineData} onClick={handleTimelineClick}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="index" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                    <Line type="monotone" dataKey="severity" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', cursor: 'pointer' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Severity Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={severityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                    <Bar dataKey="value" fill="#6366f1" onClick={handleSeverityClick} cursor="pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Type Chart & Findings Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Detection Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label onClick={handleTypeClick} cursor="pointer">
                                        {typeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 bg-black/80 backdrop-blur-lg border-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Live Findings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-[300px]">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                                        <tr>
                                            <th className="pb-3 px-4">Time</th>
                                            <th className="pb-3 px-4">Type</th>
                                            <th className="pb-3 px-4">Details</th>
                                            <th className="pb-3 px-4">Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {findings.slice(-10).reverse().map((f) => (
                                            <tr
                                                key={f.id}
                                                className="border-b border-gray-800 hover:bg-gray-950 cursor-pointer transition-colors"
                                                onClick={() => setSelectedFinding(f)}
                                            >
                                                <td className="py-3 px-4 text-xs text-gray-400">
                                                    {new Date(f.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline">{f.type.toUpperCase()}</Badge>
                                                </td>
                                                <td className="py-3 px-4 max-w-xs truncate">{f.details}</td>
                                                <td className={`py-3 px-4 font-mono ${getSeverityColor(f.severity)}`}>
                                                    {f.severity.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Inspector Panel */}
            {/* Filter Modal */}
            {filterModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setFilterModal({ ...filterModal, open: false })}>
                    <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto bg-black border-gray-900" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    {filterModal.title}
                                </CardTitle>
                                <button onClick={() => setFilterModal({ ...filterModal, open: false })} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {filterModal.findings.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">No findings match this filter</p>
                                ) : (
                                    filterModal.findings.map((f) => (
                                        <div
                                            key={f.id}
                                            className="p-4 rounded-lg bg-black hover:bg-gray-950 cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedFinding(f);
                                                setFilterModal({ ...filterModal, open: false });
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">{f.type.toUpperCase()}</Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(f.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className={`font-mono font-bold ${getSeverityColor(f.severity)}`}>
                                                    {f.severity.toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300">{f.details}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Inspector Panel */}
            {selectedFinding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedFinding(null)}>
                    <Card className="w-full max-w-2xl bg-black border-gray-900" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Finding Inspector
                                </CardTitle>
                                <button onClick={() => setSelectedFinding(null)} className="text-gray-400 hover:text-white">
                                    ✕
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-gray-400">Type</label>
                                <div className="text-2xl font-bold mt-1">{selectedFinding.type.toUpperCase()}</div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Severity</label>
                                <div className={`text-2xl font-bold mt-1 ${getSeverityColor(selectedFinding.severity)}`}>
                                    {selectedFinding.severity.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Timestamp</label>
                                <div className="mt-1">{new Date(selectedFinding.timestamp).toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Details</label>
                                <div className="mt-2 p-4 rounded-lg bg-black text-sm whitespace-pre-wrap">
                                    {selectedFinding.details}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Source Metadata</label>
                                <pre className="mt-2 p-4 rounded-lg bg-black text-xs overflow-auto text-indigo-300">
                                    {JSON.stringify(getMetadata(selectedFinding), null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
