import React, { useState } from 'react';
import { Finding } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, DollarSign, Activity, CheckCircle, XCircle, AlertCircle, X, Info, Clock, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, Treemap } from 'recharts';
import {
    getExecutiveMetrics,
    getBusinessImpacts,
    getComplianceFrameworks,
    generateExecutiveSummary,
    getTopRisks,
    getDetailedCostBreakdown
} from '../lib/executive-insights';
import {
    generateTimeSeriesData,
    compareTimePeriods,
    generateHeatMapData,
    generateSankeyData,
    generateTreemapData,
    generateSparklineData
} from '../lib/analytics';

import Sparkline from './Sparkline';
import CustomTreemapContent from './CustomTreemapContent';
import DrillDownModal from './DrillDownModal';
import ExportDropdown from './ExportDropdown';

interface ExecutiveDashboardViewProps {
    findings: Finding[];
}

const RISK_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981'
};

const SEVERITY_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981'];

export default function ExecutiveDashboardView({ findings }: ExecutiveDashboardViewProps) {
    const [showCostModal, setShowCostModal] = useState(false);
    const [timeRange, setTimeRange] = useState<24 | 168>(24);
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [drillDownTitle, setDrillDownTitle] = useState('');
    const [drillDownFindings, setDrillDownFindings] = useState<Finding[]>([]);
    const metrics = getExecutiveMetrics(findings);
    const businessImpacts = getBusinessImpacts(findings);
    const complianceFrameworks = getComplianceFrameworks(findings);
    const summary = generateExecutiveSummary(findings);
    const topRisks = getTopRisks(findings);
    const costBreakdown = getDetailedCostBreakdown(findings);

    // Time-based analytics data
    const timeSeriesData = generateTimeSeriesData(findings, timeRange);
    const timeComparison = compareTimePeriods(findings, timeRange);
    const heatMapData = generateHeatMapData(findings);
    const sankeyData = generateSankeyData(findings);
    const treemapData = generateTreemapData(findings);
    const riskSparkline = generateSparklineData(findings.filter(f => f.severity >= 0.7), 12);
    const aiSparkline = generateSparklineData(findings.filter(f => f.type === 'endpoint'), 12);

    // Export handlers


    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const payload = data.activePayload[0].payload;
            const timestamp = new Date(payload.timestamp);
            const endTime = new Date(timestamp.getTime() + 3600000); // 1 hour window

            const relevantFindings = findings.filter(f => {
                const fTime = new Date(f.timestamp).getTime();
                return fTime >= timestamp.getTime() && fTime < endTime.getTime();
            });

            setDrillDownTitle(`Findings at ${timestamp.toLocaleTimeString()}`);
            setDrillDownFindings(relevantFindings);
            setDrillDownOpen(true);
        }
    };

    const handleTreemapClick = (data: any) => {
        if (data && data.name) {
            // Filter based on severity or type from treemap node
            const relevantFindings = findings.filter(f => {
                if (data.severity) {
                    // Map severity string to number range
                    if (data.severity === 'critical') return f.severity >= 0.8;
                    if (data.severity === 'high') return f.severity >= 0.7 && f.severity < 0.8;
                    if (data.severity === 'medium') return f.severity >= 0.5 && f.severity < 0.7;
                    if (data.severity === 'low') return f.severity < 0.5;
                }
                return f.type.toLowerCase() === data.name.toLowerCase();
            });

            setDrillDownTitle(`${data.name} Findings`);
            setDrillDownFindings(relevantFindings);
            setDrillDownOpen(true);
        }
    };



    const handleHeatmapClick = (day: string, hour: number, value: number) => {
        if (value > 0) {
            // Filter findings for this specific day and hour
            // Note: This requires mapping day string to day index (0-6)
            const dayMap: { [key: string]: number } = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
            const dayIndex = dayMap[day];

            const relevantFindings = findings.filter(f => {
                const date = new Date(f.timestamp);
                return date.getDay() === dayIndex && date.getHours() === hour;
            });

            setDrillDownTitle(`${day} ${hour}:00 Findings`);
            setDrillDownFindings(relevantFindings);
            setDrillDownOpen(true);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (score >= 40) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        return 'text-green-400 bg-green-500/10 border-green-500/30';
    };

    const getComplianceColor = (score: number) => {
        if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getTrendIcon = () => {
        if (metrics.riskTrend === 'up') return <TrendingUp className="w-5 h-5 text-red-400" />;
        if (metrics.riskTrend === 'down') return <TrendingDown className="w-5 h-5 text-green-400" />;
        return <Minus className="w-5 h-5 text-gray-400" />;
    };

    const getStatusIcon = (status: string) => {
        if (status === 'Compliant') return <CheckCircle className="w-5 h-5 text-green-400" />;
        if (status === 'At Risk') return <AlertCircle className="w-5 h-5 text-yellow-400" />;
        return <XCircle className="w-5 h-5 text-red-400" />;
    };

    const impactChartData = businessImpacts.map(impact => ({
        name: impact.category,
        value: impact.count,
        cost: impact.estimatedCost
    }));

    // Radar chart data for risk assessment
    const radarData = [
        {
            category: 'Security',
            score: Math.max(0, 100 - (findings.filter(f => f.type === 'network').length * 5)),
            fullMark: 100
        },
        {
            category: 'Compliance',
            score: metrics.complianceScore,
            fullMark: 100
        },
        {
            category: 'Data Protection',
            score: Math.max(0, 100 - (findings.filter(f => f.severity >= 0.7).length * 10)),
            fullMark: 100
        },
        {
            category: 'AI Governance',
            score: Math.max(0, 100 - (metrics.shadowAIInstances * 20)),
            fullMark: 100
        },
        {
            category: 'Incident Response',
            score: Math.max(0, 100 - metrics.riskScore),
            fullMark: 100
        }
    ];

    return (
        <div className="space-y-6" id="executive-dashboard-content">
            {/* Executive Summary */}
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                <CardHeader>
                    <CardTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Executive Security Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg text-gray-200 leading-relaxed">{summary.overview}</p>
                    <div className="text-sm text-gray-400 italic">{summary.trend}</div>
                </CardContent>
            </Card>

            {/* Export Buttons */}
            <div className="flex justify-end">
                <ExportDropdown findings={findings} elementIdToCapture="executive-dashboard-content" />
            </div>


            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={`border-2 ${getRiskColor(metrics.riskScore)} hover:shadow-lg transition-all`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Overall Risk Score</span>
                            {getTrendIcon()}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className={`text-5xl font-bold ${getRiskColor(metrics.riskScore).split(' ')[0]}`}>
                                {metrics.riskScore}
                            </div>
                            <div className="text-2xl text-gray-400">/100</div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            {metrics.riskScore >= 70 ? 'High Risk - Immediate Action Required' :
                                metrics.riskScore >= 40 ? 'Moderate Risk - Monitor Closely' :
                                    'Low Risk - Maintain Vigilance'}
                        </div>
                        {riskSparkline.length > 0 && (
                            <div className="mt-3">
                                <Sparkline data={riskSparkline} color="#ef4444" height={30} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`border-2 ${getComplianceColor(metrics.complianceScore)} hover:shadow-lg transition-all`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Compliance Status</span>
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className={`text-5xl font-bold ${getComplianceColor(metrics.complianceScore).split(' ')[0]}`}>
                                {metrics.complianceScore}
                            </div>
                            <div className="text-2xl text-gray-400">%</div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            {metrics.complianceScore >= 80 ? 'Good Standing' :
                                metrics.complianceScore >= 60 ? 'Needs Attention' :
                                    'Critical Gaps'}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer"
                    onClick={() => setShowCostModal(true)}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Estimated Cost Impact</span>
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-5 h-5 text-red-400" />
                                <Info className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-red-400">
                            {formatCurrency(metrics.estimatedCostImpact)}
                        </div>
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <span>Potential financial exposure</span>
                            <span className="text-indigo-400">• Click for details</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Shadow AI Instances</span>
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-5xl font-bold text-purple-400">{metrics.shadowAIInstances}</div>
                        <div className="text-xs text-gray-400 mt-2">Unauthorized AI tools detected</div>
                        {aiSparkline.length > 0 && (
                            <div className="mt-3">
                                <Sparkline data={aiSparkline} color="#a855f7" height={30} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Time-Based Analytics */}
            <div className="mb-6">
                {/* Risk Trend Chart */}
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Risk Trend Analysis
                            </CardTitle>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTimeRange(24)}
                                    className={`px-3 py-1 rounded text-xs ${timeRange === 24 ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                                >
                                    24H
                                </button>
                                <button
                                    onClick={() => setTimeRange(168)}
                                    className={`px-3 py-1 rounded text-xs ${timeRange === 168 ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                                >
                                    7D
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeSeriesData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis
                                    dataKey="timestamp"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }}
                                    labelFormatter={(value) => new Date(value).toLocaleString()}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="riskScore" stroke="#ef4444" strokeWidth={2} name="Risk Score" />
                                <Line type="monotone" dataKey="findingCount" stroke="#6366f1" strokeWidth={2} name="Findings" />
                                <Line type="monotone" dataKey="criticalCount" stroke="#f59e0b" strokeWidth={2} name="Critical" />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Time Comparison */}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                                <div className="text-xs text-gray-400">Risk Score Change</div>
                                <div className={`text-2xl font-bold ${timeComparison.change.riskScore > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {timeComparison.change.riskScore > 0 ? '+' : ''}{timeComparison.change.riskScore}
                                </div>
                                <div className="text-xs text-gray-500">{timeComparison.percentChange.riskScore.toFixed(1)}%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                                <div className="text-xs text-gray-400">Findings Change</div>
                                <div className={`text-2xl font-bold ${timeComparison.change.findingCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {timeComparison.change.findingCount > 0 ? '+' : ''}{timeComparison.change.findingCount}
                                </div>
                                <div className="text-xs text-gray-500">{timeComparison.percentChange.findingCount.toFixed(1)}%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                                <div className="text-xs text-gray-400">Critical Change</div>
                                <div className={`text-2xl font-bold ${timeComparison.change.criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {timeComparison.change.criticalCount > 0 ? '+' : ''}{timeComparison.change.criticalCount}
                                </div>
                                <div className="text-xs text-gray-500">{timeComparison.percentChange.criticalCount.toFixed(1)}%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Heatmap Visualization */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Risk Heatmap (Day vs Hour)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1">
                                {/* Header Row */}
                                <div className="h-6"></div>
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="text-[10px] text-gray-500 text-center">{i}</div>
                                ))}

                                {/* Data Rows */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <React.Fragment key={day}>
                                        <div className="text-xs text-gray-400 pr-2 flex items-center">{day}</div>
                                        {Array.from({ length: 24 }).map((_, hour) => {
                                            const cell = heatMapData.find(d => d.day === day && d.hour === hour);
                                            const value = cell ? cell.value : 0;
                                            const opacity = Math.min(value / 5, 1); // Normalize opacity
                                            return (
                                                <div
                                                    key={hour}
                                                    className="h-6 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer"
                                                    style={{
                                                        backgroundColor: value > 0 ? `rgba(239, 68, 68, ${0.2 + opacity * 0.8})` : '#1f2937',
                                                        border: value > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #374151'
                                                    }}
                                                    title={`${day} ${hour}:00 - Risk Score: ${value.toFixed(1)}`}
                                                    onClick={() => handleHeatmapClick(day, hour, value)}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Treemap */}
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Risk Hierarchy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <Treemap
                                data={treemapData.children as any}
                                dataKey="value"
                                stroke="#fff"
                                fill="#8884d8"
                                content={<CustomTreemapContent />}
                                onClick={handleTreemapClick}
                                style={{ cursor: 'pointer' }}
                            />
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sankey Diagram - Simplified version */}
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Risk Flow Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="text-sm text-gray-400 mb-4">Findings → Business Impact → Cost</div>
                            {sankeyData.links.slice(0, 5).map((link, index) => {
                                const source = sankeyData.nodes[link.source]?.name || 'Unknown';
                                const target = sankeyData.nodes[link.target]?.name || 'Unknown';
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-900 rounded p-2 text-xs text-gray-300">{source}</div>
                                        <div className="text-gray-500">→</div>
                                        <div className="flex-1 bg-gray-900 rounded p-2 text-xs text-gray-300">{target}</div>
                                        <div className="text-xs text-indigo-400 font-mono">{link.value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>


            {/* Risk Assessment Radar Chart */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Security Posture Assessment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                            <Radar name="Current Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                            <Legend />
                            <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-xs text-gray-400 text-center">
                        Higher scores indicate better security posture in each category
                    </div>
                </CardContent>
            </Card>

            {/* Top Risks */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Top Risks Requiring Attention
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topRisks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                                <p>No critical risks identified. Continue monitoring.</p>
                            </div>
                        ) : (
                            topRisks.map((risk, index) => (
                                <div key={index} className="p-4 rounded-lg bg-gray-900 border-l-4 hover:bg-gray-800 transition-colors" style={{ borderLeftColor: RISK_COLORS[risk.severity] }}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white text-lg">{risk.title}</h4>
                                                <Badge className={
                                                    risk.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                        risk.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                }>
                                                    {risk.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">{risk.impact}</p>
                                            <div className="text-xs text-gray-500">Affected Systems: {risk.affectedSystems}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded">
                                        <div className="text-xs text-gray-400 mb-1">Recommended Action:</div>
                                        <div className="text-sm text-indigo-300">{risk.recommendation}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Business Impact & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Impact */}
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Business Impact Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {businessImpacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No significant business impacts detected</div>
                        ) : (
                            <div className="space-y-4">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={impactChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="space-y-2">
                                    {businessImpacts.map((impact, index) => (
                                        <div key={index} className="p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-white">{impact.category}</span>
                                                <span className="text-sm text-red-400 font-mono">{formatCurrency(impact.estimatedCost)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">{impact.description}</p>
                                            <div className="text-xs text-gray-500 mt-1">{impact.count} incidents</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Compliance Frameworks */}
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Compliance Framework Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {complianceFrameworks.map((framework, index) => (
                                <div key={index} className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(framework.status)}
                                            <span className="font-semibold text-white text-lg">{framework.name}</span>
                                        </div>
                                        <Badge className={
                                            framework.status === 'Compliant' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                framework.status === 'At Risk' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                        }>
                                            {framework.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${framework.score >= 80 ? 'bg-green-500' :
                                                        framework.score >= 60 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}
                                                    style={{ width: `${framework.score}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-mono text-gray-400">{framework.score}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {framework.affectedFindings} findings affecting compliance
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Findings & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Key Findings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.keyFindings.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No significant findings</div>
                        ) : (
                            <ul className="space-y-3">
                                {summary.keyFindings.map((finding, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors">
                                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-300">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Recommended Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {summary.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
                                    <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Drill Down Modal */}
            <DrillDownModal
                isOpen={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={drillDownTitle}
                findings={drillDownFindings}
            />

            {/* Cost Breakdown Modal */}
            {showCostModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCostModal(false)}>
                    <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-black border-indigo-500/30" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b border-gray-800 sticky top-0 bg-black z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                                        <DollarSign className="w-6 h-6" />
                                        Financial Risk Justification
                                    </CardTitle>
                                    <p className="text-sm text-gray-400 mt-1">Detailed cost breakdown and methodology</p>
                                </div>
                                <button onClick={() => setShowCostModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Cost Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Total Estimated Impact</h3>
                                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                            {formatCurrency(costBreakdown.totalCost)}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-2">
                                            Based on {findings.length} findings across {findings.filter(f => f.type === 'network').length} network and {findings.filter(f => f.type === 'endpoint').length} endpoint assets.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {costBreakdown.breakdownItems.map((item, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{item.category}</div>
                                                <div className="text-xl font-bold text-gray-200">{formatCurrency(item.totalCost)}</div>
                                                <div className="text-xs text-gray-500 mt-1">{item.findingCount} findings × {formatCurrency(item.costPerFinding)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-900/30 border border-gray-800">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Cost Distribution</h3>
                                    <div className="w-full h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={costBreakdown.breakdownItems as any}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="totalCost"
                                                    nameKey="category"
                                                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                                >
                                                    {costBreakdown.breakdownItems.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => formatCurrency(value)}
                                                    contentStyle={{ backgroundColor: '#1a2142', border: '1px solid #6366f1' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Justification */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-indigo-400" />
                                    Risk Justification & Benchmarks
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    {costBreakdown.breakdownItems.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-indigo-500/30 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-indigo-300">{item.category}</h4>
                                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                                                    {formatCurrency(item.costPerFinding)} / incident
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-3">{item.justification}</p>
                                            <div className="space-y-2">
                                                <div className="text-xs font-semibold text-gray-500 uppercase">Potential Impacts:</div>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {item.examples.map((ex, i) => (
                                                        <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                                                            {ex}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Methodology Footer */}
                            <div className="mt-6 pt-6 border-t border-gray-800 text-xs text-gray-500 space-y-2">
                                <p><span className="font-semibold text-gray-400">Methodology:</span> {costBreakdown.methodology}</p>
                                <div>
                                    <span className="font-semibold text-gray-400">Key Assumptions:</span>
                                    <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                                        {costBreakdown.assumptions.map((assumption, i) => (
                                            <li key={i}>{assumption}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowCostModal(false)}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
