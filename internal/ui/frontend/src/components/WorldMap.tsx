import { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Finding } from '../types';

interface Connection {
    id: string;
    from: [number, number]; // [lon, lat]
    to: [number, number];   // [lon, lat]
    severity: number;
    timestamp: number;
    finding: Finding;
    srcIp?: string;
    dstIp?: string;
    location?: string;
}

interface WorldMapProps {
    findings: Finding[];
}

interface TooltipData {
    x: number;
    y: number;
    connection: Connection;
}

const CITY_NAMES = [
    'London', 'Tokyo', 'New York', 'Paris', 'Sydney',
    'Singapore', 'Moscow', 'São Paulo', 'Mumbai', 'Berlin'
];

export default function WorldMap({ findings }: WorldMapProps) {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const globeEl = useRef<any>(null);

    // Responsive sizing
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({
                    width: Math.max(300, width),
                    height: Math.max(300, height),
                });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Build connections from recent network findings
    useEffect(() => {
        const networkFindings = findings.filter(f => f.type === 'network').slice(-15);
        const destinations = [
            [51.5074, -0.1278],   // London
            [35.6762, 139.6503],  // Tokyo
            [40.7128, -74.0060],  // New York
            [48.8566, 2.3522],    // Paris
            [-33.8688, 151.2093], // Sydney
            [1.3521, 103.8198],   // Singapore
            [55.7558, 37.6173],   // Moscow
            [-23.5505, -46.6333], // São Paulo
            [19.0760, 72.8777],   // Mumbai
            [52.5200, 13.4050],   // Berlin
        ];
        const newConnections = networkFindings.map((f, i) => {
            let srcLat = 37.7749;
            let srcLon = -122.4194;
            const [dstLat, dstLon] = destinations[i % destinations.length];
            let srcIp = 'Unknown';
            let dstIp = 'Unknown';

            try {
                const meta = JSON.parse(f.source || '{}');
                if (meta.src_ip) {
                    srcIp = meta.src_ip;
                    const parts = meta.src_ip.split('.');
                    if (parts.length === 4) {
                        const hash = parts.reduce((a: number, b: string) => a + parseInt(b || '0'), 0);
                        srcLat += ((hash % 20) - 10) * 0.5;
                        srcLon += ((hash % 20) - 10) * 0.5;
                    }
                }
                if (meta.dst_ip) {
                    dstIp = meta.dst_ip;
                }
            } catch (_) { }

            return {
                id: `${f.id}-${i}`,
                from: [srcLon, srcLat] as [number, number],
                to: [dstLon, dstLat] as [number, number],
                severity: f.severity,
                timestamp: new Date(f.timestamp).getTime(),
                finding: f,
                srcIp,
                dstIp,
                location: CITY_NAMES[i % CITY_NAMES.length],
            };
        });
        setConnections(newConnections);
    }, [findings]);

    // Auto-rotate globe
    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return '#ef4444'; // red
        if (severity >= 0.5) return '#f59e0b'; // orange
        return '#10b981'; // green
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 0.8) return 'Critical';
        if (severity >= 0.7) return 'High';
        if (severity >= 0.5) return 'Medium';
        return 'Low';
    };

    // Convert connections to arcs data with hover handlers
    const arcsData = connections.map(conn => ({
        startLat: conn.from[1],
        startLng: conn.from[0],
        endLat: conn.to[1],
        endLng: conn.to[0],
        color: getSeverityColor(conn.severity),
        severity: conn.severity,
        connection: conn,
    }));

    // Convert connections to points data (source and destination)
    const pointsData = connections.flatMap(conn => [
        {
            lat: conn.from[1],
            lng: conn.from[0],
            size: 0.3,
            color: getSeverityColor(conn.severity),
            connection: conn,
        },
        {
            lat: conn.to[1],
            lng: conn.to[0],
            size: 0.3,
            color: getSeverityColor(conn.severity),
            connection: conn,
        },
    ]);

    // Calculate statistics
    const stats = {
        totalConnections: connections.length,
        criticalCount: connections.filter(c => c.severity >= 0.8).length,
        avgSeverity: connections.length > 0
            ? connections.reduce((sum, c) => sum + c.severity, 0) / connections.length
            : 0,
        uniqueLocations: new Set(connections.map(c => c.location)).size,
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-gray-800">
            {connections.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse"></div>
                        </div>
                        <p className="text-gray-400 text-sm">Waiting for network traffic...</p>
                        <p className="text-gray-500 text-xs mt-1">Globe will appear when connections are detected</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="relative" style={{
                        filter: 'drop-shadow(0 0 40px rgba(99, 102, 241, 0.4)) drop-shadow(0 0 80px rgba(99, 102, 241, 0.2))'
                    }}>
                        <Globe
                            ref={globeEl}
                            width={dimensions.width}
                            height={dimensions.height}
                            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                            backgroundColor="rgba(0,0,0,0)"
                            atmosphereColor="#6366f1"
                            atmosphereAltitude={0.2}

                            // Arcs configuration
                            arcsData={arcsData}
                            arcColor="color"
                            arcDashLength={0.4}
                            arcDashGap={0.2}
                            arcDashAnimateTime={2000}
                            arcStroke={0.5}
                            onArcClick={(arc: any) => setSelectedConnection(arc.connection)}
                            onArcHover={(arc: any) => {
                                if (arc && arc.connection) {
                                    // Note: Getting exact mouse position is complex with 3D globe
                                    // Using a fixed position for now
                                    setTooltip({
                                        x: dimensions.width / 2,
                                        y: dimensions.height / 2,
                                        connection: arc.connection,
                                    });
                                } else {
                                    setTooltip(null);
                                }
                            }}

                            // Points configuration
                            pointsData={pointsData}
                            pointColor="color"
                            pointAltitude={0.01}
                            pointRadius="size"

                            // Enable pointer interaction
                            enablePointerInteraction={true}
                        />
                    </div>
                </div>
            )}

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute bg-black/95 backdrop-blur-md border border-indigo-500/30 rounded-lg p-3 pointer-events-none z-50 shadow-xl"
                    style={{
                        left: '50%',
                        top: '20%',
                        transform: 'translateX(-50%)',
                        minWidth: '250px',
                    }}
                >
                    <div className="text-xs space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Connection Details</span>
                            <span className={`font-bold ${tooltip.connection.severity >= 0.8 ? 'text-red-400' : tooltip.connection.severity >= 0.5 ? 'text-orange-400' : 'text-green-400'}`}>
                                {getSeverityLabel(tooltip.connection.severity)}
                            </span>
                        </div>
                        <div>
                            <div className="text-gray-400">Source IP</div>
                            <div className="text-white font-mono">{tooltip.connection.srcIp}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Destination</div>
                            <div className="text-white">{tooltip.connection.location}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Severity Score</div>
                            <div className="text-white font-mono">{tooltip.connection.severity.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Timestamp</div>
                            <div className="text-white text-xs">{new Date(tooltip.connection.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                            <div className="text-indigo-400 text-xs">Click for full details</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Connection Modal */}
            {selectedConnection && (
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setSelectedConnection(null)}
                >
                    <div
                        className="bg-black border border-indigo-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Connection Inspector
                            </h3>
                            <button
                                onClick={() => setSelectedConnection(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="text-xs uppercase text-gray-400">Route</label>
                                <div className="mt-1 text-white">
                                    {selectedConnection.srcIp} → {selectedConnection.location}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Severity</label>
                                <div className={`mt-1 text-2xl font-bold ${selectedConnection.severity >= 0.8 ? 'text-red-400' : selectedConnection.severity >= 0.5 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {selectedConnection.severity.toFixed(2)} - {getSeverityLabel(selectedConnection.severity)}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Finding Details</label>
                                <div className="mt-2 p-3 rounded-lg bg-gray-900 text-sm">
                                    {selectedConnection.finding.details}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Timestamp</label>
                                <div className="mt-1 text-white">
                                    {new Date(selectedConnection.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-400">Source Metadata</label>
                                <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-xs overflow-auto text-indigo-300 max-h-40">
                                    {JSON.stringify(JSON.parse(selectedConnection.finding.source || '{}'), null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
                <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-300">Low (&lt; 0.5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-300">Medium (0.5-0.7)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">Critical (≥ 0.8)</span>
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Overlay */}
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700 space-y-3">
                <div>
                    <div className="text-xs text-gray-400">Active Connections</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {stats.totalConnections}
                    </div>
                </div>
                <div className="border-t border-gray-700 pt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Critical</span>
                        <span className="text-red-400 font-bold">{stats.criticalCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Avg Severity</span>
                        <span className="text-white font-mono">{stats.avgSeverity.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Locations</span>
                        <span className="text-indigo-400 font-bold">{stats.uniqueLocations}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
