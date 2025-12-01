import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Finding } from '../types';
import {
    generateRiskScore,
    detectAnomalies,
    generateRecommendations,
    predictNextHour,
    calculateSeverityDistribution,
} from '../lib/insights';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Activity, BarChart3 } from 'lucide-react';

interface InsightsPanelProps {
    findings: Finding[];
    isOpen: boolean;
    onClose: () => void;
}

export default function InsightsPanel({ findings, isOpen, onClose }: InsightsPanelProps) {
    const [riskScore, setRiskScore] = useState(generateRiskScore(findings));
    const [anomalies, setAnomalies] = useState(detectAnomalies(findings));
    const [recommendations, setRecommendations] = useState(generateRecommendations(findings));
    const [prediction, setPrediction] = useState(predictNextHour(findings));
    const [distribution, setDistribution] = useState(calculateSeverityDistribution(findings));

    useEffect(() => {
        setRiskScore(generateRiskScore(findings));
        setAnomalies(detectAnomalies(findings));
        setRecommendations(generateRecommendations(findings));
        setPrediction(predictNextHour(findings));
        setDistribution(calculateSeverityDistribution(findings));
    }, [findings]);

    if (!isOpen) return null;

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-green-400 bg-green-500/10 border-green-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getTrendIcon = () => {
        switch (riskScore.trend) {
            case 'worsening': return <TrendingUp className="w-4 h-4 text-red-400" />;
            case 'improving': return <TrendingDown className="w-4 h-4 text-green-400" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <Card
                className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-black border-indigo-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                <CardHeader className="border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    AI Security Insights
                                </CardTitle>
                                <p className="text-xs text-gray-400 mt-1">Real-time risk analysis and recommendations</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Risk Score Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Overall Risk Assessment
                        </h3>
                        <div className={`p-4 rounded-lg border ${getRiskColor(riskScore.level)}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-xs uppercase text-gray-400 mb-1">Risk Level</div>
                                    <div className="text-2xl font-bold">{riskScore.level.toUpperCase()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase text-gray-400 mb-1">Risk Score</div>
                                    <div className="text-4xl font-bold">{riskScore.score}</div>
                                    <div className="text-xs text-gray-400">/ 100</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm mb-3">
                                {getTrendIcon()}
                                <span className="text-gray-300">
                                    Trend: <span className="font-semibold">{riskScore.trend}</span>
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs uppercase text-gray-400">Contributing Factors:</div>
                                {riskScore.factors.map((factor, i) => (
                                    <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="text-indigo-400">•</span>
                                        {factor}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Severity Distribution */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Severity Distribution</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="text-xs text-gray-400">Low</div>
                                <div className="text-2xl font-bold text-green-400">{distribution.low.count}</div>
                                <div className="text-xs text-gray-400 mt-1">{distribution.low.percentage.toFixed(1)}%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                <div className="text-xs text-gray-400">Medium</div>
                                <div className="text-2xl font-bold text-yellow-400">{distribution.medium.count}</div>
                                <div className="text-xs text-gray-400 mt-1">{distribution.medium.percentage.toFixed(1)}%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                <div className="text-xs text-gray-400">High</div>
                                <div className="text-2xl font-bold text-orange-400">{distribution.high.count}</div>
                                <div className="text-xs text-gray-400 mt-1">{distribution.high.percentage.toFixed(1)}%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="text-xs text-gray-400">Critical</div>
                                <div className="text-2xl font-bold text-red-400">{distribution.critical.count}</div>
                                <div className="text-xs text-gray-400 mt-1">{distribution.critical.percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Predictions */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Predictive Analysis</h3>
                        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Predicted Findings (Next Hour)</div>
                                    <div className="text-3xl font-bold text-indigo-400">{prediction.predicted}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 mb-1">Confidence</div>
                                    <div className="text-2xl font-bold text-purple-400">{prediction.confidence}%</div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                                Based on recent activity patterns and trend analysis
                            </div>
                        </div>
                    </div>

                    {/* Anomalies */}
                    {anomalies.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                Detected Anomalies
                            </h3>
                            <div className="space-y-2">
                                {anomalies.map((anomaly, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg border ${anomaly.severity === 'high'
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : anomaly.severity === 'medium'
                                                    ? 'bg-orange-500/10 border-orange-500/30'
                                                    : 'bg-yellow-500/10 border-yellow-500/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={getPriorityColor(anomaly.severity)}>
                                                        {anomaly.severity.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {anomaly.timestamp.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-200">{anomaly.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400">Value</div>
                                                <div className="text-lg font-bold text-white">{anomaly.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-400" />
                            Recommended Actions
                        </h3>
                        <div className="space-y-3">
                            {recommendations.map((rec, i) => (
                                <div
                                    key={i}
                                    className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={getPriorityColor(rec.priority)}>
                                                    {rec.priority.toUpperCase()}
                                                </Badge>
                                                <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        <div className="p-2 rounded bg-black/50">
                                            <div className="text-gray-400 mb-1">Action Required</div>
                                            <div className="text-gray-200">{rec.action}</div>
                                        </div>
                                        <div className="p-2 rounded bg-black/50">
                                            <div className="text-gray-400 mb-1">Expected Impact</div>
                                            <div className="text-green-400">{rec.impact}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                        <div className="text-xs uppercase text-gray-400 mb-2">Summary</div>
                        <div className="text-sm text-gray-200 space-y-1">
                            <p>
                                • Analyzed <span className="font-bold text-white">{findings.length}</span> total findings
                            </p>
                            <p>
                                • Current risk level: <span className={`font-bold ${getRiskColor(riskScore.level).split(' ')[0]}`}>
                                    {riskScore.level.toUpperCase()}
                                </span>
                            </p>
                            <p>
                                • {anomalies.length} anomalies detected requiring attention
                            </p>
                            <p>
                                • {recommendations.length} actionable recommendations generated
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
