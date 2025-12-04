

interface CustomTreemapContentProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    value?: number;
    severity?: string;
}

const COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#10b981'
};

export default function CustomTreemapContent(props: CustomTreemapContentProps) {
    const { x = 0, y = 0, width = 0, height = 0, name, value, severity } = props;

    if (width < 40 || height < 30) return null;

    const color = severity ? COLORS[severity] : '#6366f1';

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    fillOpacity: 0.3,
                    stroke: color,
                    strokeWidth: 2,
                    strokeOpacity: 0.8
                }}
            />
            {width > 60 && height > 40 ? (
                <>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 - 8}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={Math.min(width / 8, height / 4, 14)}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                    >
                        {name}
                    </text>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={Math.min(width / 10, height / 5, 12)}
                        style={{ pointerEvents: 'none' }}
                    >
                        {value}
                    </text>
                </>
            ) : null}
        </g>
    );
}
