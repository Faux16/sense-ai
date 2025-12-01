import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Finding } from '../types';
import { Activity, FileText, Settings, AlertTriangle, CheckCircle, Download, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityLogViewProps {
    findings: Finding[];
}

interface ActivityEntry {
    id: string;
    type: 'finding' | 'policy' | 'user' | 'system';
    action: string;
    description: string;
    timestamp: Date;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    user?: string;
}

export default function ActivityLogView({ findings }: ActivityLogViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Generate activity entries from findings
    const activities = useMemo(() => {
        const entries: ActivityEntry[] = findings.map(f => ({
            id: String(f.id),
            type: 'finding' as const,
            action: 'Finding Detected',
            description: f.details,
            timestamp: new Date(f.timestamp),
            severity: f.severity >= 0.8 ? 'critical' : f.severity >= 0.7 ? 'high' : f.severity >= 0.5 ? 'medium' : 'low',
        }));

        // Add some system events
        entries.push({
            id: 'sys-001',
            type: 'system',
            action: 'Scanner Started',
            description: 'Network scanner initialized on interface en0',
            timestamp: new Date(Date.now() - 3600000),
        });

        entries.push({
            id: 'sys-002',
            type: 'system',
            action: 'Policies Loaded',
            description: 'Loaded 5 security policies from configuration',
            timestamp: new Date(Date.now() - 3500000),
        });

        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [findings]);

    // Filter activities
    const filteredActivities = useMemo(() => {
        let filtered = activities;

        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.action.toLowerCase().includes(query) ||
                a.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [activities, typeFilter, searchQuery]);

    // Activity timeline data
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

        filteredActivities.forEach(a => {
            const hourIndex = hours.findIndex(h => h.hour === a.timestamp.getHours());
            if (hourIndex !== -1) {
                hours[hourIndex].count++;
            }
        });

        return hours;
    }, [filteredActivities]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'finding': return <AlertTriangle className="w-4 h-4" />;
            case 'policy': return <FileText className="w-4 h-4" />;
            case 'user': return <Activity className="w-4 h-4" />;
            case 'system': return <Settings className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'finding': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'policy': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'user': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'system': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const exportActivities = () => {
        const dataStr = JSON.stringify(filteredActivities, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-log-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Total Activities</div>
                        <div className="text-3xl font-bold text-white">{filteredActivities.length}</div>
                        <div className="text-xs text-gray-400 mt-1">Logged events</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Findings</div>
                        <div className="text-3xl font-bold text-red-400">
                            {filteredActivities.filter(a => a.type === 'finding').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Detected issues</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">System Events</div>
                        <div className="text-3xl font-bold text-green-400">
                            {filteredActivities.filter(a => a.type === 'system').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">System actions</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Last Hour</div>
                        <div className="text-3xl font-bold text-purple-400">
                            {filteredActivities.filter(a => Date.now() - a.timestamp.getTime() < 3600000).length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Recent activity</div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Activity Timeline (24 Hours)
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

            {/* Filters */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search activities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Types</option>
                            <option value="finding">Findings</option>
                            <option value="policy">Policies</option>
                            <option value="user">User Actions</option>
                            <option value="system">System Events</option>
                        </select>
                        <button
                            onClick={exportActivities}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Log */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Activity Log ({filteredActivities.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredActivities.map((activity) => (
                            <div key={activity.id} className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-all">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
                                        {getTypeIcon(activity.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <div>
                                                <div className="font-semibold text-white">{activity.action}</div>
                                                <div className="text-sm text-gray-400 mt-1">{activity.description}</div>
                                            </div>
                                            {activity.severity && (
                                                <Badge className={
                                                    activity.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                        activity.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                            activity.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                                'bg-green-500/20 text-green-400 border-green-500/30'
                                                }>
                                                    {activity.severity.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                            <span>{activity.timestamp.toLocaleString()}</span>
                                            <span>•</span>
                                            <span className="capitalize">{activity.type}</span>
                                            {activity.user && (
                                                <>
                                                    <span>•</span>
                                                    <span>User: {activity.user}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
