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
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        setRiskScore(generateRiskScore(findings));
        setAnomalies(detectAnomalies(findings));
        setRecommendations(generateRecommendations(findings));
        setPrediction(predictNextHour(findings));
        setDistribution(calculateSeverityDistribution(findings));
    }, [findings]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 3}s`
                            }}
                        />
                    ))}
                </div>

                {/* Main loader container */}
                <div className="relative z-10">
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 -m-16">
                        <div className="w-64 h-64 rounded-full border-2 border-transparent border-t-indigo-500/50 border-r-purple-500/50 animate-spin" style={{ animationDuration: '3s' }}></div>
                    </div>

                    {/* Middle rotating ring */}
                    <div className="absolute inset-0 -m-12">
                        <div className="w-56 h-56 rounded-full border-2 border-transparent border-b-cyan-500/50 border-l-purple-500/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                    </div>

                    {/* Inner pulsing rings */}
                    <div className="absolute inset-0 -m-8">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                    </div>

                    <div className="absolute inset-0 -m-6">
                        <div className="w-44 h-44 rounded-full bg-gradient-to-r from-purple-500/30 to-cyan-500/30 animate-pulse"></div>
                    </div>

                    {/* Logo container with glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 blur-2xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-black/50 backdrop-blur-sm rounded-full p-8 border border-indigo-500/30">
                            <img
                                src={`${import.meta.env.BASE_URL}logo_collapse.png`}
                                alt="SENSE AI"
                                className="w-24 h-24 relative z-10 drop-shadow-2xl"
                                style={{
                                    filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
                                    animation: 'float 3s ease-in-out infinite'
                                }}
                            />
                        </div>
                    </div>

                    {/* Scanning beam effect */}
                    <div className="absolute inset-0 -m-8 overflow-hidden rounded-full">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
                            style={{
                                animation: 'scan 2s linear infinite',
                                transformOrigin: 'center'
                            }}
                        ></div>
                    </div>
                </div>

                {/* Text content */}
                <div className="mt-16 text-center relative z-10">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                        style={{
                            backgroundSize: '200% auto',
                            animation: 'gradient 3s linear infinite'
                        }}>
                        Analyzing Shadow AI Activity
                    </h2>
                    <p className="text-sm text-gray-400 animate-pulse">
                        Scanning network patterns • Detecting anomalies • Generating insights
                    </p>
                </div>

                {/* Progress indicators */}
                <div className="mt-8 flex gap-2 relative z-10">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{
                                animation: 'bounce 1.4s ease-in-out infinite',
                                animationDelay: `${i * 0.15}s`
                            }}
                        ></div>
                    ))}
                </div>

                {/* Loading percentage */}
                <div className="mt-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
                                style={{
                                    animation: 'progress 2s ease-in-out infinite',
                                    backgroundSize: '200% 100%'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* CSS animations */}
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-10px) rotate(5deg); }
                    }
                    @keyframes scan {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes gradient {
                        0% { background-position: 0% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes progress {
                        0% { width: 0%; background-position: 0% center; }
                        50% { width: 100%; background-position: 100% center; }
                        100% { width: 100%; background-position: 200% center; }
                    }
                `}</style>
            </div>
        );
    }

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
