import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Finding } from '../types';
import { Search, Filter, Download, CheckSquare, Square, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { groupRelatedFindings, calculateSeverityDistribution } from '../lib/insights';

interface FindingsViewProps {
    findings: Finding[];
}

type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
type TypeFilter = 'all' | 'network' | 'endpoint';
type TimeFilter = '1h' | '24h' | '7d' | '30d' | 'all';

export default function FindingsView({ findings }: FindingsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
    const [selectedFindings, setSelectedFindings] = useState<Set<number>>(new Set());
    const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

    // Filter findings
    const filteredFindings = useMemo(() => {
        let filtered = findings;

        // Time filter
        const now = Date.now();
        const timeRanges = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000,
            'all': Infinity,
        };
        filtered = filtered.filter(f =>
            now - new Date(f.timestamp).getTime() < timeRanges[timeFilter]
        );

        // Severity filter
        if (severityFilter !== 'all') {
            const severityRanges = {
                low: [0, 0.5],
                medium: [0.5, 0.7],
                high: [0.7, 0.8],
                critical: [0.8, 1],
            };
            const [min, max] = severityRanges[severityFilter];
            filtered = filtered.filter(f => f.severity >= min && f.severity < max);
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(f => f.type === typeFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                f.id.toString().toLowerCase().includes(query) ||
                f.details.toLowerCase().includes(query) ||
                f.type.toLowerCase().includes(query) ||
                (f.source && f.source.toLowerCase().includes(query))
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [findings, searchQuery, severityFilter, typeFilter, timeFilter]);

    // Analytics data
    const distribution = calculateSeverityDistribution(filteredFindings);
    const groupedFindings = groupRelatedFindings(filteredFindings);

    const severityData = [
        { name: 'Low', value: distribution.low.count, fill: '#10b981' },
        { name: 'Medium', value: distribution.medium.count, fill: '#f59e0b' },
        { name: 'High', value: distribution.high.count, fill: '#f97316' },
        { name: 'Critical', value: distribution.critical.count, fill: '#ef4444' },
    ];

    const typeData = [
        { name: 'Network', value: filteredFindings.filter(f => f.type === 'network').length },
        { name: 'Endpoint', value: filteredFindings.filter(f => f.type === 'endpoint').length },
    ];

    // Timeline data (last 24 hours by hour)
    const timelineData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => {
            const hour = new Date();
            hour.setHours(hour.getHours() - (23 - i));
            hour.setMinutes(0, 0, 0);
            return {
                hour: hour.getHours(),
                label: `${hour.getHours()}:00`,
                count: 0,
            };
        });

        filteredFindings.forEach(f => {
            const findingDate = new Date(f.timestamp);
            const hourIndex = hours.findIndex(h => h.hour === findingDate.getHours());
            if (hourIndex !== -1) {
                hours[hourIndex].count++;
            }
        });

        return hours;
    }, [filteredFindings]);

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (severity >= 0.7) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        if (severity >= 0.5) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-green-400 bg-green-500/10 border-green-500/30';
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 0.8) return 'Critical';
        if (severity >= 0.7) return 'High';
        if (severity >= 0.5) return 'Medium';
        return 'Low';
    };

    const toggleSelection = (id: number) => {
        const newSelection = new Set(selectedFindings);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedFindings(newSelection);
    };

    const selectAll = () => {
        if (selectedFindings.size === filteredFindings.length) {
            setSelectedFindings(new Set());
        } else {
            setSelectedFindings(new Set(filteredFindings.map(f => f.id)));
        }
    };

    const exportSelected = () => {
        const toExport = filteredFindings.filter(f => selectedFindings.has(f.id));
        const dataStr = JSON.stringify(toExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `findings-export-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400">Total Findings</div>
                        <div className="text-3xl font-bold text-white">{filteredFindings.length}</div>
                        <div className="text-xs text-gray-400 mt-1">Filtered results</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400">Critical</div>
                        <div className="text-3xl font-bold text-red-400">{distribution.critical.count}</div>
                        <div className="text-xs text-gray-400 mt-1">{distribution.critical.percentage.toFixed(1)}% of total</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400">Grouped Sources</div>
                        <div className="text-3xl font-bold text-purple-400">{groupedFindings.size}</div>
                        <div className="text-xs text-gray-400 mt-1">Unique sources</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400">Avg Severity</div>
                        <div className="text-3xl font-bold text-green-400">
                            {filteredFindings.length > 0
                                ? (filteredFindings.reduce((sum, f) => sum + f.severity, 0) / filteredFindings.length).toFixed(2)
                                : '0.00'
                            }
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Across all findings</div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Findings Timeline (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4" />
                            Severity Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Type Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={typeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                <Bar dataKey="value" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search findings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Types</option>
                                <option value="network">Network</option>
                                <option value="endpoint">Endpoint</option>
                            </select>

                            <select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="1h">Last Hour</option>
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedFindings.size > 0 && (
                        <div className="mt-4 flex items-center gap-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                            <span className="text-sm text-gray-300">
                                {selectedFindings.size} finding{selectedFindings.size > 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={exportSelected}
                                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Selected
                            </button>
                            <button
                                onClick={() => setSelectedFindings(new Set())}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Findings List */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Findings ({filteredFindings.length})
                        </CardTitle>
                        <button
                            onClick={selectAll}
                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
                        >
                            {selectedFindings.size === filteredFindings.length ? (
                                <><CheckSquare className="w-4 h-4" /> Deselect All</>
                            ) : (
                                <><Square className="w-4 h-4" /> Select All</>
                            )}
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredFindings.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No findings match your filters</p>
                                <p className="text-sm mt-2">Try adjusting your search criteria</p>
                            </div>
                        ) : (
                            filteredFindings.map((finding) => (
                                <div
                                    key={finding.id}
                                    className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleSelection(finding.id)}
                                            className="mt-1 text-gray-400 hover:text-indigo-400"
                                        >
                                            {selectedFindings.has(finding.id) ? (
                                                <CheckSquare className="w-5 h-5" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className={getSeverityColor(finding.severity)}>
                                                        {getSeverityLabel(finding.severity)}
                                                    </Badge>
                                                    <Badge variant="outline">{finding.type.toUpperCase()}</Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(finding.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Severity</div>
                                                    <div className={`text-lg font-bold ${getSeverityColor(finding.severity).split(' ')[0]}`}>
                                                        {finding.severity.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-2">{finding.details}</p>
                                            <button
                                                onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                            >
                                                {expandedFinding === finding.id ? 'Hide Details' : 'Show Details'}
                                            </button>
                                            {expandedFinding === finding.id && (
                                                <div className="mt-3 p-3 bg-black rounded-lg">
                                                    <div className="text-xs space-y-2">
                                                        <div>
                                                            <span className="text-gray-400">ID:</span>
                                                            <span className="text-white ml-2 font-mono">{finding.id}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Source Metadata:</span>
                                                            <pre className="mt-1 p-2 bg-gray-900 rounded text-indigo-300 overflow-auto">
                                                                {JSON.stringify(JSON.parse(finding.source || '{}'), null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
