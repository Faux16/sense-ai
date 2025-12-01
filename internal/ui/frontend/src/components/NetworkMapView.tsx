import { useState } from 'react';
import { Finding } from '../types';
import WorldMap from './WorldMap';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Globe, Maximize2, Minimize2, X } from 'lucide-react';

interface NetworkMapViewProps {
    findings: Finding[];
}

export default function NetworkMapView({ findings }: NetworkMapViewProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const networkFindings = findings.filter(f => f.type === 'network');

    // Calculate network statistics
    const stats = {
        totalConnections: networkFindings.length,
        uniqueSources: new Set(networkFindings.map(f => {
            try {
                const meta = JSON.parse(f.source || '{}');
                return meta.src_ip || 'unknown';
            } catch {
                return 'unknown';
            }
        })).size,
        criticalConnections: networkFindings.filter(f => f.severity >= 0.8).length,
        avgSeverity: networkFindings.length > 0
            ? networkFindings.reduce((sum, f) => sum + f.severity, 0) / networkFindings.length
            : 0,
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-400">Total Connections</div>
                            <Globe className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalConnections}</div>
                        <div className="text-xs text-gray-400 mt-1">Network findings</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Unique Sources</div>
                        <div className="text-3xl font-bold text-purple-400">{stats.uniqueSources}</div>
                        <div className="text-xs text-gray-400 mt-1">Different IPs</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Critical</div>
                        <div className="text-3xl font-bold text-red-400">{stats.criticalConnections}</div>
                        <div className="text-xs text-gray-400 mt-1">High severity</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-gray-400 mb-2">Avg Severity</div>
                        <div className="text-3xl font-bold text-green-400">{stats.avgSeverity.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-1">Overall risk</div>
                    </CardContent>
                </Card>
            </div>

            {/* Full-Screen Globe */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Global Network Traffic Visualization
                        </CardTitle>
                        <button
                            onClick={() => setIsFullScreen(true)}
                            className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Maximize2 className="w-4 h-4" />
                            Full Screen
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[600px]">
                        <WorldMap findings={findings} />
                    </div>
                </CardContent>
            </Card>

            {/* Connection Details */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Recent Network Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {networkFindings.slice(0, 20).map((finding) => {
                            let srcIp = 'Unknown';
                            let dstIp = 'Unknown';
                            try {
                                const meta = JSON.parse(finding.source || '{}');
                                srcIp = meta.src_ip || 'Unknown';
                                dstIp = meta.dst_ip || 'Unknown';
                            } catch { }

                            return (
                                <div key={finding.id} className="p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-300 mb-1">
                                                <span className="font-mono text-indigo-400">{srcIp}</span>
                                                <span className="mx-2 text-gray-500">→</span>
                                                <span className="font-mono text-purple-400">{dstIp}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">{finding.details}</div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className={`text-lg font-bold ${finding.severity >= 0.8 ? 'text-red-400' :
                                                finding.severity >= 0.5 ? 'text-orange-400' : 'text-green-400'
                                                }`}>
                                                {finding.severity.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(finding.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Full-Screen Modal */}
            {isFullScreen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    {/* Full-Screen Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/80 backdrop-blur-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Global Network Traffic
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {stats.totalConnections} connections • {stats.uniqueSources} sources • {stats.criticalConnections} critical
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Minimize2 className="w-4 h-4" />
                                Exit Full Screen
                            </button>
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Full-Screen Globe */}
                    <div className="flex-1 relative">
                        <WorldMap findings={findings} />
                    </div>

                    {/* Full-Screen Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-4 pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-lg border border-indigo-500/30 rounded-lg p-4 pointer-events-auto">
                            <div className="text-xs text-gray-400 mb-1">Total Connections</div>
                            <div className="text-2xl font-bold text-white">{stats.totalConnections}</div>
                        </div>
                        <div className="bg-black/80 backdrop-blur-lg border border-purple-500/30 rounded-lg p-4 pointer-events-auto">
                            <div className="text-xs text-gray-400 mb-1">Unique Sources</div>
                            <div className="text-2xl font-bold text-purple-400">{stats.uniqueSources}</div>
                        </div>
                        <div className="bg-black/80 backdrop-blur-lg border border-red-500/30 rounded-lg p-4 pointer-events-auto">
                            <div className="text-xs text-gray-400 mb-1">Critical</div>
                            <div className="text-2xl font-bold text-red-400">{stats.criticalConnections}</div>
                        </div>
                        <div className="bg-black/80 backdrop-blur-lg border border-green-500/30 rounded-lg p-4 pointer-events-auto">
                            <div className="text-xs text-gray-400 mb-1">Avg Severity</div>
                            <div className="text-2xl font-bold text-green-400">{stats.avgSeverity.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
