import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Finding } from '../types';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GatewayViewProps {
    findings: Finding[];
}

export default function GatewayView({ findings }: GatewayViewProps) {
    // Filter for Gateway findings (and potentially Network ones if relevant)
    const gatewayFindings = findings.filter(f => f.type === 'gateway');

    // Stats
    const blockedCount = gatewayFindings.filter(f => f.details.includes("Blocked")).length;
    const alertCount = gatewayFindings.filter(f => !f.details.includes("Blocked")).length;
    // We don't have "Allowed" count from findings alone, so we'll focus on Violations

    const violationData = [
        { name: 'Blocked', value: blockedCount, color: '#ef4444' },
        { name: 'Alerts', value: alertCount, color: '#f59e0b' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900 border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Interceptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            {gatewayFindings.length}
                            <Shield className="w-5 h-5 text-indigo-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Policy events processed</p>
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900 border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Blocked Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            {blockedCount}
                            <Lock className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Prevented by policy</p>
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900 border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">DLP Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            {alertCount}
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sensitive content detected</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <Card className="lg:col-span-1 bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
                            Enforcement Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={violationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {violationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Logs */}
                <Card className="lg:col-span-2 bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Recent Gateway Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto max-h-[400px]">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                                    <tr>
                                        <th className="pb-3 px-4">Time</th>
                                        <th className="pb-3 px-4">Action</th>
                                        <th className="pb-3 px-4">Details</th>
                                        <th className="pb-3 px-4">Payload Snippet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gatewayFindings.slice().reverse().map((f) => {
                                        const isBlock = f.details.includes("Blocked");
                                        const timestamp = new Date(f.timestamp).toLocaleString();
                                        // Attempt to show snippet
                                        let snippet = "N/A";
                                        try {
                                            // f.source might be raw JSON
                                            snippet = f.source.slice(0, 50) + "...";
                                        } catch (e) { }

                                        return (
                                            <tr key={f.id} className="border-b border-gray-800 hover:bg-gray-950/50">
                                                <td className="py-3 px-4 text-xs text-gray-400">{timestamp}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className={isBlock ? "border-red-500 text-red-400" : "border-amber-500 text-amber-400"}>
                                                        {isBlock ? "BLOCKED" : "ALERT"}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-gray-300">{f.details}</td>
                                                <td className="py-3 px-4 font-mono text-xs text-gray-500 truncate max-w-[150px]">{snippet}</td>
                                            </tr>
                                        );
                                    })}
                                    {gatewayFindings.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-500">
                                                No gateway activity recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
