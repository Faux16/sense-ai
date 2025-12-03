import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Finding, SourceMetadata } from './types';
import { api } from './lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Shield, AlertTriangle, TrendingUp, X, Sparkles, TrendingDown } from 'lucide-react';
import WorldMap from './components/WorldMap';
import Sidebar from './components/Sidebar';
import InsightsPanel from './components/InsightsPanel';
import FindingsView from './components/FindingsView';
import PoliciesView from './components/PoliciesView';
import NetworkMapView from './components/NetworkMapView';
import ActivityLogView from './components/ActivityLogView';
import SettingsView from './components/SettingsView';
import ExecutiveDashboardView from './components/ExecutiveDashboardView';
import { calculateTrends } from './lib/insights';


const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

// Type definitions for chart data
interface SeverityDataItem {
    name: string;
    value: number;
    fill: string;
    range: [number, number];
}

interface TypeDataItem {
    name: string;
    value: number;
    type: string;
}

interface TimelineDataItem {
    index: number;
    severity: number;
    finding: Finding;
}

export default function Dashboard() {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
    const [currentSection, setCurrentSection] = useState('dashboard');
    const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
    const [filterModal, setFilterModal] = useState<{ open: boolean; title: string; findings: Finding[] }>({
        open: false,
        title: '',
        findings: [],
    });
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);

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

    // Calculate stats with trends
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const twoHoursAgo = now - 7200000;

    const recentFindings = findings.filter(f => new Date(f.timestamp).getTime() > oneHourAgo);
    const previousFindings = findings.filter(f => {
        const time = new Date(f.timestamp).getTime();
        return time > twoHoursAgo && time <= oneHourAgo;
    });

    const stats = {
        total: findings.length,
        critical: findings.filter(f => f.severity >= 0.8).length,
        policies: 5,
        rate: findings.filter(f => Date.now() - new Date(f.timestamp).getTime() < 60000).length,
        trends: {
            total: calculateTrends([previousFindings.length, recentFindings.length]),
            critical: calculateTrends([
                previousFindings.filter(f => f.severity >= 0.8).length,
                recentFindings.filter(f => f.severity >= 0.8).length
            ]),
        },
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

    const getSeverityLabel = (severity: number): string => {
        if (severity >= 0.8) return 'Critical';
        if (severity >= 0.7) return 'High';
        if (severity >= 0.5) return 'Medium';
        return 'Low';
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

    // Chart click handlers with proper type safety
    // Recharts passes extended data objects that include our custom properties
    const handleSeverityClick = (data: unknown) => {
        const item = data as SeverityDataItem | null;
        if (!item?.range) return;
        const [min, max] = item.range;
        const filtered = findings.filter(f => f.severity >= min && f.severity < max);
        setFilterModal({ open: true, title: `${item.name} Severity Findings`, findings: filtered });
    };

    const handleTypeClick = (data: unknown) => {
        const item = data as TypeDataItem | null;
        if (!item?.type) return;
        const filtered = findings.filter(f => f.type === item.type);
        setFilterModal({ open: true, title: `${item.name} Findings`, findings: filtered });
    };

    const handleTimelineClick = (data: unknown) => {
        const chartData = data as { activePayload?: Array<{ payload: TimelineDataItem }> } | null;
        if (chartData?.activePayload?.[0]?.payload?.finding) {
            setSelectedFinding(chartData.activePayload[0].payload.finding);
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Sidebar */}
            <Sidebar currentSection={currentSection} onSectionChange={setCurrentSection} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="border-b border-gray-900 bg-black/60 backdrop-blur-lg sticky top-0 z-50">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
                            </h2>
                            <p className="text-xs text-gray-400">Real-time Shadow AI Detection & Monitoring</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setInsightsPanelOpen(true)}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/50"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Insights
                            </button>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                LIVE
                            </Badge>
                            <span className="text-sm text-gray-400">{new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        {/* Render different views based on current section */}
                        {currentSection === 'executive' && <ExecutiveDashboardView findings={findings} />}
                        {currentSection === 'dashboard' && (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <Card
                                        onClick={() => handleStatClick('all')}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View all ${stats.total} findings`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStatClick('all')}
                                        onMouseEnter={() => setHoveredStat('total')}
                                        onMouseLeave={() => setHoveredStat(null)}
                                        className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer hover:scale-105 relative group"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-400">Total Findings</span>
                                                <Activity className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-3xl font-bold">{stats.total}</div>
                                                {stats.trends.total.direction !== 'stable' && (
                                                    <div className={`flex items-center gap-1 text-xs ${stats.trends.total.direction === 'up' ? 'text-red-400' : 'text-green-400'
                                                        }`}>
                                                        {stats.trends.total.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {stats.trends.total.percentage.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
                                            {hoveredStat === 'total' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/95 backdrop-blur-md border border-indigo-500/30 rounded-lg shadow-xl z-10 text-xs">
                                                    <div className="font-semibold text-white mb-2">Detailed Insights</div>
                                                    <div className="space-y-1 text-gray-300">
                                                        <div>• Recent: {recentFindings.length} findings</div>
                                                        <div>• Previous hour: {previousFindings.length} findings</div>
                                                        <div>• Trend: {stats.trends.total.direction}</div>
                                                        <div className="text-indigo-400 mt-2">Click for full list</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card
                                        onClick={() => handleStatClick('critical')}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View ${stats.critical} critical findings`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStatClick('critical')}
                                        onMouseEnter={() => setHoveredStat('critical')}
                                        onMouseLeave={() => setHoveredStat(null)}
                                        className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer hover:scale-105 relative group"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-400">Critical</span>
                                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-3xl font-bold text-red-400">{stats.critical}</div>
                                                {stats.trends.critical.direction !== 'stable' && (
                                                    <div className={`flex items-center gap-1 text-xs ${stats.trends.critical.direction === 'up' ? 'text-red-400' : 'text-green-400'
                                                        }`}>
                                                        {stats.trends.critical.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {stats.trends.critical.percentage.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Severity ≥ 0.8</div>
                                            {hoveredStat === 'critical' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/95 backdrop-blur-md border border-red-500/30 rounded-lg shadow-xl z-10 text-xs">
                                                    <div className="font-semibold text-white mb-2">Critical Findings Analysis</div>
                                                    <div className="space-y-1 text-gray-300">
                                                        <div>• Requires immediate attention</div>
                                                        <div>• Average severity: {stats.critical > 0 ? (findings.filter(f => f.severity >= 0.8).reduce((sum, f) => sum + f.severity, 0) / stats.critical).toFixed(2) : 'N/A'}</div>
                                                        <div>• Trend: {stats.trends.critical.direction}</div>
                                                        <div className="text-red-400 mt-2">Click to view all critical findings</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card
                                        onMouseEnter={() => setHoveredStat('policies')}
                                        onMouseLeave={() => setHoveredStat(null)}
                                        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer hover:scale-105 relative group"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-400">Policies Active</span>
                                                <Shield className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="text-3xl font-bold text-purple-400">{stats.policies}</div>
                                            <div className="text-xs text-gray-400 mt-1">Loaded from config</div>
                                            {hoveredStat === 'policies' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-xl z-10 text-xs">
                                                    <div className="font-semibold text-white mb-2">Policy Information</div>
                                                    <div className="space-y-1 text-gray-300">
                                                        <div>• All policies are active</div>
                                                        <div>• Monitoring network and endpoint activity</div>
                                                        <div>• Auto-detection enabled</div>
                                                        <div className="text-purple-400 mt-2">Navigate to Policies for details</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card
                                        onMouseEnter={() => setHoveredStat('rate')}
                                        onMouseLeave={() => setHoveredStat(null)}
                                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer hover:scale-105 relative group"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-400">Detection Rate</span>
                                                <TrendingUp className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div className="text-3xl font-bold text-green-400">{stats.rate.toFixed(1)}</div>
                                            <div className="text-xs text-gray-400 mt-1">Per minute</div>
                                            {hoveredStat === 'rate' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/95 backdrop-blur-md border border-green-500/30 rounded-lg shadow-xl z-10 text-xs">
                                                    <div className="font-semibold text-white mb-2">Detection Rate Details</div>
                                                    <div className="space-y-1 text-gray-300">
                                                        <div>• Last minute: {stats.rate} findings</div>
                                                        <div>• Real-time monitoring active</div>
                                                        <div>• Network and endpoint scanning</div>
                                                        <div className="text-green-400 mt-2">System is actively detecting threats</div>
                                                    </div>
                                                </div>
                                            )}
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
                                            <div className="h-[500px]">
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
                            </>
                        )}

                        {/* Other Pages */}
                        {currentSection === 'findings' && <FindingsView findings={findings} />}
                        {currentSection === 'policies' && <PoliciesView findings={findings} />}
                        {currentSection === 'network' && <NetworkMapView findings={findings} />}
                        {currentSection === 'activity' && <ActivityLogView findings={findings} />}
                        {currentSection === 'settings' && <SettingsView />}
                    </div>
                </div>
            </div>

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
                                                <span className={`font-mono font-bold ${getSeverityColor(f.severity)}`} aria-label={`Severity: ${getSeverityLabel(f.severity)}`}>
                                                    {f.severity.toFixed(2)} ({getSeverityLabel(f.severity)})
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
                                <label id="type-label" className="text-xs uppercase text-gray-400">Type</label>
                                <div className="text-2xl font-bold mt-1" aria-labelledby="type-label">{selectedFinding.type.toUpperCase()}</div>
                            </div>
                            <div>
                                <label id="severity-label" className="text-xs uppercase text-gray-400">Severity</label>
                                <div className={`text-2xl font-bold mt-1 ${getSeverityColor(selectedFinding.severity)}`} aria-labelledby="severity-label">
                                    {selectedFinding.severity.toFixed(2)} ({getSeverityLabel(selectedFinding.severity)})
                                </div>
                            </div>
                            <div>
                                <label id="timestamp-label" className="text-xs uppercase text-gray-400">Timestamp</label>
                                <div className="mt-1" aria-labelledby="timestamp-label">{new Date(selectedFinding.timestamp).toLocaleString()}</div>
                            </div>
                            <div>
                                <label id="details-label" className="text-xs uppercase text-gray-400">Details</label>
                                <div className="mt-2 p-4 rounded-lg bg-black text-sm whitespace-pre-wrap" aria-labelledby="details-label">
                                    {selectedFinding.details}
                                </div>
                            </div>
                            <div>
                                <label id="metadata-label" className="text-xs uppercase text-gray-400">Source Metadata</label>
                                <pre className="mt-2 p-4 rounded-lg bg-black text-xs overflow-auto text-indigo-300" aria-labelledby="metadata-label">
                                    {JSON.stringify(getMetadata(selectedFinding), null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Insights Panel */}
            <InsightsPanel
                findings={findings}
                isOpen={insightsPanelOpen}
                onClose={() => setInsightsPanelOpen(false)}
            />
        </div>
    );
}
