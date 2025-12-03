import { Finding } from '../types';

// Time-based analytics interfaces
export interface TimeSeriesDataPoint {
    timestamp: Date;
    riskScore: number;
    findingCount: number;
    criticalCount: number;
}

export interface TimeComparison {
    current: {
        period: string;
        riskScore: number;
        findingCount: number;
        criticalCount: number;
    };
    previous: {
        period: string;
        riskScore: number;
        findingCount: number;
        criticalCount: number;
    };
    change: {
        riskScore: number;
        findingCount: number;
        criticalCount: number;
    };
    percentChange: {
        riskScore: number;
        findingCount: number;
        criticalCount: number;
    };
}

export interface HeatMapData {
    day: string;
    hour: number;
    value: number;
}

export interface SankeyNode {
    name: string;
}

export interface SankeyLink {
    source: number;
    target: number;
    value: number;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

export interface TreemapData {
    name: string;
    children?: TreemapData[];
    value?: number;
    severity?: string;
}

// Generate time series data for trend analysis
export function generateTimeSeriesData(findings: Finding[], hours: number = 24): TimeSeriesDataPoint[] {
    const now = Date.now();
    const dataPoints: TimeSeriesDataPoint[] = [];

    for (let i = hours - 1; i >= 0; i--) {
        const timestamp = new Date(now - i * 3600000);
        const hourStart = timestamp.getTime();
        const hourEnd = hourStart + 3600000;

        const hourFindings = findings.filter(f => {
            const fTime = new Date(f.timestamp).getTime();
            return fTime >= hourStart && fTime < hourEnd;
        });

        const criticalCount = hourFindings.filter(f => f.severity >= 0.8).length;
        const avgSeverity = hourFindings.length > 0
            ? hourFindings.reduce((sum, f) => sum + f.severity, 0) / hourFindings.length
            : 0;

        dataPoints.push({
            timestamp,
            riskScore: Math.round(avgSeverity * 100),
            findingCount: hourFindings.length,
            criticalCount
        });
    }

    return dataPoints;
}

// Compare current period with previous period
export function compareTimePeriods(findings: Finding[], periodHours: number = 24): TimeComparison {
    const now = Date.now();
    const periodMs = periodHours * 3600000;

    const currentFindings = findings.filter(f =>
        now - new Date(f.timestamp).getTime() < periodMs
    );

    const previousFindings = findings.filter(f => {
        const age = now - new Date(f.timestamp).getTime();
        return age >= periodMs && age < periodMs * 2;
    });

    const calcMetrics = (fList: Finding[]) => {
        const criticalCount = fList.filter(f => f.severity >= 0.8).length;
        const avgSeverity = fList.length > 0
            ? fList.reduce((sum, f) => sum + f.severity, 0) / fList.length
            : 0;
        return {
            riskScore: Math.round(avgSeverity * 100),
            findingCount: fList.length,
            criticalCount
        };
    };

    const current = calcMetrics(currentFindings);
    const previous = calcMetrics(previousFindings);

    const change = {
        riskScore: current.riskScore - previous.riskScore,
        findingCount: current.findingCount - previous.findingCount,
        criticalCount: current.criticalCount - previous.criticalCount
    };

    const percentChange = {
        riskScore: previous.riskScore > 0 ? (change.riskScore / previous.riskScore) * 100 : 0,
        findingCount: previous.findingCount > 0 ? (change.findingCount / previous.findingCount) * 100 : 0,
        criticalCount: previous.criticalCount > 0 ? (change.criticalCount / previous.criticalCount) * 100 : 0
    };

    const periodLabel = periodHours === 24 ? 'Last 24 Hours' :
        periodHours === 168 ? 'Last Week' :
            `Last ${periodHours} Hours`;

    return {
        current: { period: periodLabel, ...current },
        previous: { period: `Previous ${periodLabel}`, ...previous },
        change,
        percentChange
    };
}

// Generate heat map data for risk by time
export function generateHeatMapData(findings: Finding[]): HeatMapData[] {
    const heatMap: HeatMapData[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize all cells
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            heatMap.push({
                day: days[day],
                hour,
                value: 0
            });
        }
    }

    // Populate with findings
    findings.forEach(f => {
        const date = new Date(f.timestamp);
        const day = date.getDay();
        const hour = date.getHours();
        const index = day * 24 + hour;

        if (heatMap[index]) {
            heatMap[index].value += f.severity;
        }
    });

    return heatMap;
}

// Generate Sankey diagram data
export function generateSankeyData(findings: Finding[]): SankeyData {
    const nodes: SankeyNode[] = [
        { name: 'Critical Findings' },
        { name: 'High Findings' },
        { name: 'Medium Findings' },
        { name: 'Low Findings' },
        { name: 'Data Loss' },
        { name: 'Compliance' },
        { name: 'Productivity' },
        { name: 'Security' },
        { name: 'High Cost' },
        { name: 'Medium Cost' },
        { name: 'Low Cost' }
    ];

    const links: SankeyLink[] = [];

    // Count findings by severity
    const critical = findings.filter(f => f.severity >= 0.8);
    const high = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8);
    const medium = findings.filter(f => f.severity >= 0.5 && f.severity < 0.7);
    const low = findings.filter(f => f.severity < 0.5);

    // Findings to Impact
    if (critical.length > 0) {
        links.push({ source: 0, target: 4, value: critical.filter(f => f.type === 'network').length });
        links.push({ source: 0, target: 5, value: critical.length });
    }
    if (high.length > 0) {
        links.push({ source: 1, target: 7, value: high.filter(f => f.type === 'network').length });
        links.push({ source: 1, target: 5, value: high.length });
    }
    if (medium.length > 0) {
        links.push({ source: 2, target: 6, value: medium.filter(f => f.type === 'endpoint').length });
        links.push({ source: 2, target: 7, value: medium.filter(f => f.type === 'network').length });
    }
    if (low.length > 0) {
        links.push({ source: 3, target: 6, value: low.length });
    }

    // Impact to Cost
    const dataLossCount = critical.filter(f => f.type === 'network').length;
    const complianceCount = critical.length + high.length;
    const productivityCount = medium.filter(f => f.type === 'endpoint').length + low.length;
    const securityCount = high.filter(f => f.type === 'network').length + medium.filter(f => f.type === 'network').length;

    if (dataLossCount > 0 || complianceCount > 0) {
        links.push({ source: 4, target: 8, value: dataLossCount });
        links.push({ source: 5, target: 8, value: complianceCount });
    }
    if (productivityCount > 0 || securityCount > 0) {
        links.push({ source: 6, target: 10, value: productivityCount });
        links.push({ source: 7, target: 9, value: securityCount });
    }

    return { nodes, links: links.filter(l => l.value > 0) };
}

// Generate treemap data
export function generateTreemapData(findings: Finding[]): TreemapData {
    const critical = findings.filter(f => f.severity >= 0.8);
    const high = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8);
    const medium = findings.filter(f => f.severity >= 0.5 && f.severity < 0.7);
    const low = findings.filter(f => f.severity < 0.5);

    return {
        name: 'Security Risks',
        children: [
            {
                name: 'Critical',
                severity: 'critical',
                children: [
                    { name: 'Network', value: critical.filter(f => f.type === 'network').length, severity: 'critical' },
                    { name: 'Endpoint', value: critical.filter(f => f.type === 'endpoint').length, severity: 'critical' }
                ].filter(c => c.value > 0)
            },
            {
                name: 'High',
                severity: 'high',
                children: [
                    { name: 'Network', value: high.filter(f => f.type === 'network').length, severity: 'high' },
                    { name: 'Endpoint', value: high.filter(f => f.type === 'endpoint').length, severity: 'high' }
                ].filter(c => c.value > 0)
            },
            {
                name: 'Medium',
                severity: 'medium',
                children: [
                    { name: 'Network', value: medium.filter(f => f.type === 'network').length, severity: 'medium' },
                    { name: 'Endpoint', value: medium.filter(f => f.type === 'endpoint').length, severity: 'medium' }
                ].filter(c => c.value > 0)
            },
            {
                name: 'Low',
                severity: 'low',
                children: [
                    { name: 'Network', value: low.filter(f => f.type === 'network').length, severity: 'low' },
                    { name: 'Endpoint', value: low.filter(f => f.type === 'endpoint').length, severity: 'low' }
                ].filter(c => c.value > 0)
            }
        ].filter(c => c.children && c.children.length > 0)
    };
}

// Generate sparkline data for metric cards
export function generateSparklineData(findings: Finding[], hours: number = 12): number[] {
    const now = Date.now();
    const data: number[] = [];

    for (let i = hours - 1; i >= 0; i--) {
        const hourStart = now - i * 3600000;
        const hourEnd = hourStart + 3600000;

        const count = findings.filter(f => {
            const fTime = new Date(f.timestamp).getTime();
            return fTime >= hourStart && fTime < hourEnd;
        }).length;

        data.push(count);
    }

    return data;
}

// Export data to CSV
export function exportToCSV(findings: Finding[]): string {
    const headers = ['ID', 'Type', 'Severity', 'Details', 'Source', 'Timestamp'];
    const rows = findings.map(f => [
        f.id,
        f.type,
        f.severity,
        `"${f.details.replace(/"/g, '""')}"`,
        f.source || '',
        f.timestamp
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    return csv;
}

// Download CSV file
export function downloadCSV(csv: string, filename: string = 'findings-export.csv') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export executive summary to JSON
export function exportExecutiveSummary(data: any): string {
    return JSON.stringify(data, null, 2);
}

// Download JSON file
export function downloadJSON(json: string, filename: string = 'executive-summary.json') {
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
