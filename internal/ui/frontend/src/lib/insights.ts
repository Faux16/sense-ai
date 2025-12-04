import { Finding } from '../types';

export interface TrendData {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    current: number;
    previous: number;
}

export interface Anomaly {
    type: 'spike' | 'drop' | 'unusual_pattern';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: Date;
    value: number;
}

export interface RiskScore {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    trend: 'improving' | 'worsening' | 'stable';
}

export interface Recommendation {
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action: string;
    impact: string;
}

/**
 * Calculate trend direction and percentage change
 */
export function calculateTrends(data: number[]): TrendData {
    if (data.length < 2) {
        return { direction: 'stable', percentage: 0, current: data[0] || 0, previous: 0 };
    }

    const midpoint = Math.floor(data.length / 2);
    const previous = data.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const current = data.slice(midpoint).reduce((a, b) => a + b, 0) / (data.length - midpoint);

    const change = ((current - previous) / (previous || 1)) * 100;
    const direction = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down';

    return {
        direction,
        percentage: Math.abs(change),
        current,
        previous,
    };
}

/**
 * Detect anomalies in the data
 */
export function detectAnomalies(findings: Finding[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (findings.length < 10) return anomalies;

    // Group findings by hour
    const hourlyGroups = new Map<number, Finding[]>();
    findings.forEach(f => {
        const hour = new Date(f.timestamp).getHours();
        if (!hourlyGroups.has(hour)) {
            hourlyGroups.set(hour, []);
        }
        hourlyGroups.get(hour)!.push(f);
    });

    // Calculate average and detect spikes
    const counts = Array.from(hourlyGroups.values()).map(g => g.length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const stdDev = Math.sqrt(counts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / counts.length);

    hourlyGroups.forEach((group, hour) => {
        const count = group.length;
        const deviation = (count - avg) / (stdDev || 1);

        if (deviation > 2) {
            anomalies.push({
                type: 'spike',
                severity: deviation > 3 ? 'high' : 'medium',
                description: `Unusual spike in findings detected at ${hour}:00 (${count} findings, ${Math.round(deviation)}σ above average)`,
                timestamp: new Date(group[0].timestamp),
                value: count,
            });
        } else if (deviation < -2 && count > 0) {
            anomalies.push({
                type: 'drop',
                severity: 'low',
                description: `Unusual drop in activity at ${hour}:00`,
                timestamp: new Date(group[0].timestamp),
                value: count,
            });
        }
    });

    // Detect unusual patterns (e.g., all critical findings in short time)
    const recentCritical = findings.filter(f =>
        f.severity >= 0.8 &&
        Date.now() - new Date(f.timestamp).getTime() < 3600000
    );

    if (recentCritical.length >= 5) {
        anomalies.push({
            type: 'unusual_pattern',
            severity: 'high',
            description: `${recentCritical.length} critical findings detected in the last hour`,
            timestamp: new Date(),
            value: recentCritical.length,
        });
    }

    return anomalies;
}

/**
 * Generate overall risk score
 */
export function generateRiskScore(findings: Finding[]): RiskScore {
    if (findings.length === 0) {
        return {
            score: 0,
            level: 'low',
            factors: ['No findings detected'],
            trend: 'stable',
        };
    }

    const factors: string[] = [];
    let score = 0;

    // Factor 1: Critical findings count (0-30 points)
    const criticalCount = findings.filter(f => f.severity >= 0.8).length;
    const criticalScore = Math.min(30, criticalCount * 5);
    score += criticalScore;
    if (criticalCount > 0) {
        factors.push(`${criticalCount} critical finding${criticalCount > 1 ? 's' : ''}`);
    }

    // Factor 2: High severity findings (0-25 points)
    const highCount = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8).length;
    const highScore = Math.min(25, highCount * 3);
    score += highScore;
    if (highCount > 0) {
        factors.push(`${highCount} high severity finding${highCount > 1 ? 's' : ''}`);
    }

    // Factor 3: Total volume (0-20 points)
    const volumeScore = Math.min(20, findings.length / 5);
    score += volumeScore;
    if (findings.length > 20) {
        factors.push(`High volume of findings (${findings.length})`);
    }

    // Factor 4: Recent activity (0-25 points)
    const recentFindings = findings.filter(f =>
        Date.now() - new Date(f.timestamp).getTime() < 3600000
    );
    const recentScore = Math.min(25, recentFindings.length * 2);
    score += recentScore;
    if (recentFindings.length > 5) {
        factors.push(`${recentFindings.length} findings in the last hour`);
    }

    // Determine level
    let level: RiskScore['level'];
    if (score >= 75) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';
    else level = 'low';

    // Determine trend
    const oldFindings = findings.filter(f =>
        Date.now() - new Date(f.timestamp).getTime() >= 3600000
    );
    const trend = recentFindings.length > oldFindings.length ? 'worsening' :
        recentFindings.length < oldFindings.length ? 'improving' : 'stable';

    return { score: Math.round(score), level, factors, trend };
}

/**
 * Simple prediction for next hour based on trends
 */
export function predictNextHour(findings: Finding[]): { predicted: number; confidence: number } {
    if (findings.length < 5) {
        return { predicted: 0, confidence: 0 };
    }

    // Group by hour
    const hourlyData = new Map<number, number>();
    findings.forEach(f => {
        const hour = Math.floor(new Date(f.timestamp).getTime() / 3600000);
        hourlyData.set(hour, (hourlyData.get(hour) || 0) + 1);
    });

    const counts = Array.from(hourlyData.values());
    const recent = counts.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

    // Simple linear regression
    const trend = recent.length >= 2 ? recent[recent.length - 1] - recent[0] : 0;
    const predicted = Math.max(0, Math.round(avg + trend));

    // Confidence based on data consistency
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length;
    const confidence = Math.max(0, Math.min(100, 100 - variance * 10));

    return { predicted, confidence: Math.round(confidence) };
}

/**
 * Generate actionable recommendations
 */
export function generateRecommendations(findings: Finding[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskScore = generateRiskScore(findings);

    // Critical findings recommendation
    const criticalFindings = findings.filter(f => f.severity >= 0.8);
    if (criticalFindings.length > 0) {
        recommendations.push({
            priority: 'critical',
            title: 'Address Critical Findings',
            description: `${criticalFindings.length} critical severity findings require immediate attention`,
            action: 'Review and remediate all critical findings',
            impact: 'Reduces immediate security risk',
        });
    }

    // Network findings recommendation
    const networkFindings = findings.filter(f => f.type === 'network');
    if (networkFindings.length > 10) {
        recommendations.push({
            priority: 'high',
            title: 'Review Network Security',
            description: `High volume of network-based findings detected (${networkFindings.length})`,
            action: 'Audit network policies and firewall rules',
            impact: 'Prevents unauthorized network access',
        });
    }

    // Pattern-based recommendation
    const anomalies = detectAnomalies(findings);
    if (anomalies.some(a => a.severity === 'high')) {
        recommendations.push({
            priority: 'high',
            title: 'Investigate Anomalous Activity',
            description: 'Unusual patterns detected in finding distribution',
            action: 'Review activity logs for the affected time periods',
            impact: 'Identifies potential security incidents',
        });
    }

    // Trend-based recommendation
    if (riskScore.trend === 'worsening') {
        recommendations.push({
            priority: 'medium',
            title: 'Monitor Increasing Risk Trend',
            description: 'Risk score is trending upward',
            action: 'Increase monitoring frequency and review recent changes',
            impact: 'Prevents risk escalation',
        });
    }

    // General best practice
    if (findings.length > 0 && recommendations.length === 0) {
        recommendations.push({
            priority: 'low',
            title: 'Maintain Security Posture',
            description: 'Continue monitoring for new findings',
            action: 'Regular review of security policies and findings',
            impact: 'Maintains baseline security',
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Group related findings
 */
export function groupRelatedFindings(findings: Finding[]): Map<string, Finding[]> {
    const groups = new Map<string, Finding[]>();

    findings.forEach(finding => {
        // Try to extract source IP or identifier
        let key = finding.type;
        try {
            const meta = JSON.parse(finding.source || '{}');
            if (meta.src_ip) {
                key = `${finding.type}-${meta.src_ip}`;
            } else if (meta.dst_ip) {
                key = `${finding.type}-${meta.dst_ip}`;
            }
        } catch {
            // Use type as fallback
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(finding);
    });

    return groups;
}

/**
 * Calculate detailed severity distribution
 */
export function calculateSeverityDistribution(findings: Finding[]) {
    const distribution = {
        low: { count: 0, percentage: 0, avgSeverity: 0 },
        medium: { count: 0, percentage: 0, avgSeverity: 0 },
        high: { count: 0, percentage: 0, avgSeverity: 0 },
        critical: { count: 0, percentage: 0, avgSeverity: 0 },
    };

    if (findings.length === 0) return distribution;

    let lowSum = 0, medSum = 0, highSum = 0, critSum = 0;

    findings.forEach(f => {
        if (f.severity < 0.5) {
            distribution.low.count++;
            lowSum += f.severity;
        } else if (f.severity < 0.7) {
            distribution.medium.count++;
            medSum += f.severity;
        } else if (f.severity < 0.8) {
            distribution.high.count++;
            highSum += f.severity;
        } else {
            distribution.critical.count++;
            critSum += f.severity;
        }
    });

    const total = findings.length;
    distribution.low.percentage = (distribution.low.count / total) * 100;
    distribution.medium.percentage = (distribution.medium.count / total) * 100;
    distribution.high.percentage = (distribution.high.count / total) * 100;
    distribution.critical.percentage = (distribution.critical.count / total) * 100;

    distribution.low.avgSeverity = distribution.low.count > 0 ? lowSum / distribution.low.count : 0;
    distribution.medium.avgSeverity = distribution.medium.count > 0 ? medSum / distribution.medium.count : 0;
    distribution.high.avgSeverity = distribution.high.count > 0 ? highSum / distribution.high.count : 0;
    distribution.critical.avgSeverity = distribution.critical.count > 0 ? critSum / distribution.critical.count : 0;

    return distribution;
}
