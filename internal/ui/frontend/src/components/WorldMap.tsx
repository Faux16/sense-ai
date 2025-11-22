import { useEffect, useState } from 'react';
import { Finding } from '../types';
import worldSvg from '../assets/world.svg';

interface Connection {
    id: string;
    from: [number, number]; // [lon, lat]
    to: [number, number];   // [lon, lat]
    severity: number;
    timestamp: number;
}

interface WorldMapProps {
    findings: Finding[];
}

export default function WorldMap({ findings }: WorldMapProps) {
    const [connections, setConnections] = useState<Connection[]>([]);

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
            try {
                const meta = JSON.parse(f.source || '{}');
                if (meta.src_ip) {
                    const parts = meta.src_ip.split('.');
                    if (parts.length === 4) {
                        const hash = parts.reduce((a: number, b: string) => a + parseInt(b || '0'), 0);
                        srcLat += ((hash % 20) - 10) * 0.5;
                        srcLon += ((hash % 20) - 10) * 0.5;
                    }
                }
            } catch (_) { }
            return {
                id: `${f.id}-${i}`,
                from: [srcLon, srcLat] as [number, number],
                to: [dstLon, dstLat] as [number, number],
                severity: f.severity,
                timestamp: new Date(f.timestamp).getTime(),
            };
        });
        setConnections(newConnections);
    }, [findings]);

    // Convert lon/lat to SVG coordinates (viewBox 0 0 1009 666)
    const projectPoint = (lon: number, lat: number): [number, number] => {
        const x = ((lon + 180) / 360) * 1009;
        const y = ((90 - lat) / 180) * 666;
        return [x, y];
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return '#ef4444'; // red
        if (severity >= 0.5) return '#f59e0b'; // orange
        return '#10b981'; // green
    };

    return (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-gray-800">
            <svg width="100%" height="100%" viewBox="0 0 1009 666" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Ocean background removed for premium look */}
                {/* World map image */}
                <image href={worldSvg} width="1009" height="666" preserveAspectRatio="xMidYMid meet" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.5)' }} />
                {/* Connections */}
                {connections.length === 0 ? (
                    <text x="504.5" y="333" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="500">
                        Waiting for network traffic...
                    </text>
                ) : (
                    connections.map((conn, i) => {
                        const [x1, y1] = projectPoint(conn.from[0], conn.from[1]);
                        const [x2, y2] = projectPoint(conn.to[0], conn.to[1]);
                        const color = getSeverityColor(conn.severity);
                        const mx = (x1 + x2) / 2;
                        const my = Math.min(y1, y2) - 80;
                        return (
                            <g key={conn.id} opacity="0.9">
                                <path
                                    d={`M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`}
                                    stroke={color}
                                    strokeWidth="2.5"
                                    fill="none"
                                    filter="url(#glow)"
                                    className="animate-pulse"
                                    style={{ animationDelay: `${i * 0.3}s`, animationDuration: '3s' }}
                                />
                                <circle cx={x1} cy={y1} r="6" fill={color} filter="url(#glow)" />
                                <circle cx={x2} cy={y2} r="6" fill={color} filter="url(#glow)" />
                                <circle r="5" fill="#ffffff" filter="url(#glow)">
                                    <animateMotion
                                        dur="4s"
                                        repeatCount="indefinite"
                                        begin={`${i * 0.3}s`}
                                        path={`M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`}
                                    />
                                </circle>
                            </g>
                        );
                    })
                )}
            </svg>
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
                <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-300">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-300">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">Critical</span>
                    </div>
                </div>
            </div>
            {/* Stats Overlay */}
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-400">Active Connections</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {connections.length}
                </div>
            </div>
        </div>
    );
}
