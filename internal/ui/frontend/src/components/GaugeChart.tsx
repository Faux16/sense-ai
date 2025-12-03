interface GaugeChartProps {
    value: number;
    max?: number;
    size?: number;
    label?: string;
}

export default function GaugeChart({ value, max = 100, size = 200, label }: GaugeChartProps) {
    const percentage = Math.min((value / max) * 100, 100);
    // 180 degrees range (Left to Right via Top)
    // 0% = 180 deg (Left)
    // 100% = 360 deg (Right)
    const angle = 180 + (percentage / 100) * 180;

    const getColor = () => {
        if (percentage >= 70) return '#ef4444';
        if (percentage >= 40) return '#f59e0b';
        return '#10b981';
    };

    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2 + 20; // Shift down slightly since it's top half

    // Calculate needle position
    const needleLength = radius - 20;
    const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
    const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

    return (
        <svg width={size} height={size / 2 + 40} viewBox={`0 0 ${size} ${size / 2 + 40}`}>
            {/* Background arc */}
            <path
                d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                fill="none"
                stroke="#374151"
                strokeWidth="20"
                strokeLinecap="round"
            />

            {/* Colored arc */}
            <path
                d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${needleX} ${needleY}`}
                fill="none"
                stroke={getColor()}
                strokeWidth="20"
                strokeLinecap="round"
            />

            {/* Center circle */}
            <circle cx={centerX} cy={centerY} r="8" fill={getColor()} />

            {/* Needle */}
            <line
                x1={centerX}
                y1={centerY}
                x2={needleX}
                y2={needleY}
                stroke={getColor()}
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* Value text */}
            <text
                x={centerX}
                y={centerY + 30}
                textAnchor="middle"
                fill="#fff"
                fontSize="24"
                fontWeight="bold"
            >
                {value}
            </text>

            {/* Label */}
            {label && (
                <text
                    x={centerX}
                    y={centerY + 50}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="12"
                >
                    {label}
                </text>
            )}

            {/* Min/Max labels */}
            <text x={centerX - radius - 10} y={centerY + 5} fill="#9ca3af" fontSize="10">0</text>
            <text x={centerX + radius + 10} y={centerY + 5} fill="#9ca3af" fontSize="10">{max}</text>
        </svg>
    );
}
