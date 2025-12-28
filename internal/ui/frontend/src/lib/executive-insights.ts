import { Finding } from '../types';

export interface ExecutiveMetrics {
    riskScore: number; // 0-100
    riskTrend: 'up' | 'down' | 'stable';
    complianceScore: number; // 0-100
    estimatedCostImpact: number; // in USD
    shadowAIInstances: number;
    criticalIssues: number;
}

export interface BusinessImpact {
    category: 'Data Loss' | 'Compliance' | 'Productivity' | 'Security';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    count: number;
    estimatedCost: number;
    description: string;
}

export interface ComplianceFramework {
    name: string;
    status: 'Compliant' | 'At Risk' | 'Non-Compliant';
    score: number;
    affectedFindings: number;
}

export interface ExecutiveSummary {
    overview: string;
    keyFindings: string[];
    recommendations: string[];
    trend: string;
}

export interface TopRisk {
    title: string;
    impact: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    affectedSystems: number;
    recommendation: string;
}

export interface CostBreakdownItem {
    category: string;
    findingCount: number;
    costPerFinding: number;
    totalCost: number;
    justification: string;
    examples: string[];
}

export interface DetailedCostBreakdown {
    totalCost: number;
    breakdownItems: CostBreakdownItem[];
    assumptions: string[];
    methodology: string;
}

// Calculate overall risk score based on findings
export function calculateRiskScore(findings: Finding[]): number {
    if (findings.length === 0) return 0;

    const avgSeverity = findings.reduce((sum, f) => sum + f.severity, 0) / findings.length;
    const criticalCount = findings.filter(f => f.severity >= 0.8).length;
    const recentFindings = findings.filter(f =>
        Date.now() - new Date(f.timestamp).getTime() < 3600000
    ).length;

    // Risk score formula: weighted combination of factors
    const baseScore = avgSeverity * 100;
    const criticalBonus = (criticalCount / Math.max(findings.length, 1)) * 20;
    const activityBonus = Math.min(recentFindings * 2, 15);

    return Math.min(Math.round(baseScore + criticalBonus + activityBonus), 100);
}

// Calculate risk trend
export function calculateRiskTrend(findings: Finding[]): 'up' | 'down' | 'stable' {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const twoHoursAgo = now - 7200000;

    const recentCount = findings.filter(f => new Date(f.timestamp).getTime() > oneHourAgo).length;
    const previousCount = findings.filter(f => {
        const time = new Date(f.timestamp).getTime();
        return time > twoHoursAgo && time <= oneHourAgo;
    }).length;

    if (recentCount > previousCount * 1.2) return 'up';
    if (recentCount < previousCount * 0.8) return 'down';
    return 'stable';
}

// Calculate compliance score
export function calculateComplianceScore(findings: Finding[]): number {
    const totalFindings = findings.length;
    if (totalFindings === 0) return 100;

    const criticalFindings = findings.filter(f => f.severity >= 0.8).length;
    const highFindings = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8).length;

    // Compliance score decreases with severity-weighted findings
    const complianceImpact = (criticalFindings * 10 + highFindings * 5);
    return Math.max(0, 100 - complianceImpact);
}

// Estimate cost impact
export function estimateCostImpact(findings: Finding[]): number {
    return findings.reduce((total, f) => {
        // Cost estimation based on severity
        if (f.severity >= 0.8) return total + 50000; // Critical: $50k
        if (f.severity >= 0.7) return total + 25000; // High: $25k
        if (f.severity >= 0.5) return total + 10000; // Medium: $10k
        return total + 2500; // Low: $2.5k
    }, 0);
}

// Map findings to business impact categories
export function getBusinessImpacts(findings: Finding[]): BusinessImpact[] {
    const impacts: BusinessImpact[] = [
        {
            category: 'Data Loss',
            severity: 'Critical',
            count: 0,
            estimatedCost: 0,
            description: 'Unauthorized data access or exfiltration risks'
        },
        {
            category: 'Compliance',
            severity: 'High',
            count: 0,
            estimatedCost: 0,
            description: 'Regulatory compliance violations'
        },
        {
            category: 'Productivity',
            severity: 'Medium',
            count: 0,
            estimatedCost: 0,
            description: 'Shadow AI usage affecting productivity'
        },
        {
            category: 'Security',
            severity: 'High',
            count: 0,
            estimatedCost: 0,
            description: 'Network security vulnerabilities'
        }
    ];

    findings.forEach(f => {
        // Categorize based on finding type and severity
        if (f.type === 'network' && f.severity >= 0.7) {
            impacts[0].count++; // Data Loss
            impacts[0].estimatedCost += f.severity >= 0.8 ? 50000 : 25000;
        }

        if (f.severity >= 0.8) {
            impacts[1].count++; // Compliance
            impacts[1].estimatedCost += 50000;
        }

        if (f.type === 'endpoint') {
            impacts[2].count++; // Productivity
            impacts[2].estimatedCost += 10000;
        }

        if (f.type === 'network') {
            impacts[3].count++; // Security
            impacts[3].estimatedCost += f.severity >= 0.7 ? 25000 : 10000;
        }
    });

    return impacts.filter(i => i.count > 0);
}

// Get compliance framework status
export function getComplianceFrameworks(findings: Finding[]): ComplianceFramework[] {
    const criticalCount = findings.filter(f => f.severity >= 0.8).length;
    const highCount = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8).length;

    return [
        {
            name: 'GDPR',
            status: criticalCount > 0 ? 'At Risk' : highCount > 2 ? 'At Risk' : 'Compliant',
            score: Math.max(0, 100 - (criticalCount * 15 + highCount * 5)),
            affectedFindings: criticalCount + highCount
        },
        {
            name: 'SOC 2',
            status: criticalCount > 2 ? 'Non-Compliant' : criticalCount > 0 ? 'At Risk' : 'Compliant',
            score: Math.max(0, 100 - (criticalCount * 20 + highCount * 8)),
            affectedFindings: findings.filter(f => f.severity >= 0.7).length
        },
        {
            name: 'ISO 27001',
            status: findings.length > 20 ? 'At Risk' : criticalCount > 0 ? 'At Risk' : 'Compliant',
            score: Math.max(0, 100 - (findings.length * 2)),
            affectedFindings: findings.length
        }
    ];
}

// Generate executive summary
export function generateExecutiveSummary(findings: Finding[]): ExecutiveSummary {
    const riskScore = calculateRiskScore(findings);
    const criticalCount = findings.filter(f => f.severity >= 0.8).length;
    const shadowAI = findings.filter(f => f.type === 'endpoint').length;
    const trend = calculateRiskTrend(findings);

    let overview = '';
    if (riskScore >= 70) {
        overview = `Your organization faces elevated security risks with a risk score of ${riskScore}/100. Immediate action is required to address ${criticalCount} critical issues.`;
    } else if (riskScore >= 40) {
        overview = `Your security posture is moderate with a risk score of ${riskScore}/100. ${criticalCount} critical issues require attention.`;
    } else {
        overview = `Your organization maintains a strong security posture with a risk score of ${riskScore}/100. Continue monitoring for emerging threats.`;
    }

    const keyFindings: string[] = [];
    if (shadowAI > 0) {
        keyFindings.push(`${shadowAI} unauthorized AI instances detected, posing data privacy and compliance risks`);
    }
    if (criticalCount > 0) {
        keyFindings.push(`${criticalCount} critical security vulnerabilities require immediate remediation`);
    }
    if (findings.length > 10) {
        keyFindings.push(`High volume of security events (${findings.length}) indicates increased attack surface`);
    }

    const recommendations: string[] = [];
    if (shadowAI > 0) {
        recommendations.push('Implement AI governance policy and employee training program');
    }
    if (criticalCount > 0) {
        recommendations.push('Prioritize remediation of critical vulnerabilities within 24-48 hours');
    }
    recommendations.push('Schedule executive security briefing to review findings and action plan');

    let trendText = '';
    if (trend === 'up') {
        trendText = 'Security risks are increasing. Enhanced monitoring and rapid response recommended.';
    } else if (trend === 'down') {
        trendText = 'Security posture is improving. Continue current security initiatives.';
    } else {
        trendText = 'Risk levels remain stable. Maintain vigilance and proactive monitoring.';
    }

    return { overview, keyFindings, recommendations, trend: trendText };
}

// Get top risks requiring attention
export function getTopRisks(findings: Finding[]): TopRisk[] {
    const risks: TopRisk[] = [];

    const criticalFindings = findings.filter(f => f.severity >= 0.8);
    const shadowAI = findings.filter(f => f.type === 'endpoint');
    const networkThreats = findings.filter(f => f.type === 'network' && f.severity >= 0.7);

    if (shadowAI.length > 0) {
        risks.push({
            title: 'Unauthorized AI Usage',
            impact: 'Data privacy violations, regulatory non-compliance, intellectual property leakage',
            severity: shadowAI.some(f => f.severity >= 0.8) ? 'Critical' : 'High',
            affectedSystems: shadowAI.length,
            recommendation: 'Deploy AI governance framework and restrict unapproved AI tools'
        });
    }

    if (networkThreats.length > 0) {
        risks.push({
            title: 'Network Security Vulnerabilities',
            impact: 'Potential data breaches, unauthorized access, service disruption',
            severity: networkThreats.some(f => f.severity >= 0.8) ? 'Critical' : 'High',
            affectedSystems: networkThreats.length,
            recommendation: 'Implement network segmentation and enhanced monitoring'
        });
    }

    if (criticalFindings.length > 5) {
        risks.push({
            title: 'High Volume of Critical Issues',
            impact: 'Increased attack surface, compliance violations, operational disruption',
            severity: 'Critical',
            affectedSystems: criticalFindings.length,
            recommendation: 'Establish incident response team and prioritize remediation'
        });
    }

    return risks.slice(0, 3); // Top 3 risks
}

// Get executive metrics
export function getExecutiveMetrics(findings: Finding[]): ExecutiveMetrics {
    return {
        riskScore: calculateRiskScore(findings),
        riskTrend: calculateRiskTrend(findings),
        complianceScore: calculateComplianceScore(findings),
        estimatedCostImpact: estimateCostImpact(findings),
        shadowAIInstances: findings.filter(f => f.type === 'endpoint').length,
        criticalIssues: findings.filter(f => f.severity >= 0.8).length
    };
}

// Get detailed cost breakdown with justifications
export function getDetailedCostBreakdown(findings: Finding[]): DetailedCostBreakdown {
    const breakdownItems: CostBreakdownItem[] = [];

    const criticalFindings = findings.filter(f => f.severity >= 0.8);
    const highFindings = findings.filter(f => f.severity >= 0.7 && f.severity < 0.8);
    const mediumFindings = findings.filter(f => f.severity >= 0.5 && f.severity < 0.7);
    const lowFindings = findings.filter(f => f.severity < 0.5);

    if (criticalFindings.length > 0) {
        breakdownItems.push({
            category: 'Critical Security Incidents',
            findingCount: criticalFindings.length,
            costPerFinding: 50000,
            totalCost: criticalFindings.length * 50000,
            justification: 'Critical incidents typically result in data breaches, regulatory fines, and significant remediation costs. Industry average cost per breach is $4.45M (IBM 2023), with shadow AI incidents averaging $50K per occurrence.',
            examples: [
                'Regulatory fines (GDPR: up to €20M or 4% of revenue)',
                'Data breach notification and credit monitoring',
                'Legal fees and incident response',
                'Reputation damage and customer churn'
            ]
        });
    }

    if (highFindings.length > 0) {
        breakdownItems.push({
            category: 'High-Risk Vulnerabilities',
            findingCount: highFindings.length,
            costPerFinding: 25000,
            totalCost: highFindings.length * 25000,
            justification: 'High-risk vulnerabilities require immediate attention and can lead to compliance violations, productivity loss, and security incidents if not addressed promptly.',
            examples: [
                'Emergency security patches and updates',
                'Compliance audit failures',
                'Potential service disruptions',
                'Enhanced monitoring and controls'
            ]
        });
    }

    if (mediumFindings.length > 0) {
        breakdownItems.push({
            category: 'Medium-Risk Issues',
            findingCount: mediumFindings.length,
            costPerFinding: 10000,
            totalCost: mediumFindings.length * 10000,
            justification: 'Medium-risk issues impact operational efficiency and create potential security gaps. Costs include remediation efforts, policy updates, and training.',
            examples: [
                'Policy development and enforcement',
                'Employee training programs',
                'Process improvements',
                'Tool licensing and deployment'
            ]
        });
    }

    if (lowFindings.length > 0) {
        breakdownItems.push({
            category: 'Low-Risk Observations',
            findingCount: lowFindings.length,
            costPerFinding: 2500,
            totalCost: lowFindings.length * 2500,
            justification: 'Low-risk findings represent minor security hygiene issues and best practice violations. While not immediately critical, addressing these prevents future escalation.',
            examples: [
                'Security awareness communications',
                'Minor configuration updates',
                'Documentation improvements',
                'Preventive maintenance'
            ]
        });
    }

    const totalCost = breakdownItems.reduce((sum, item) => sum + item.totalCost, 0);

    return {
        totalCost,
        breakdownItems,
        assumptions: [
            'Cost estimates based on industry benchmarks (IBM Cost of Data Breach Report 2023, Ponemon Institute)',
            'Shadow AI incidents valued at average unauthorized SaaS usage cost',
            'Regulatory fines calculated at minimum threshold levels',
            'Remediation costs include direct and indirect expenses',
            'Does not include potential revenue loss or brand damage'
        ],
        methodology: 'Costs are calculated using severity-weighted risk factors multiplied by industry-standard incident costs. Critical findings use breach cost averages, while lower severity findings use operational remediation costs.'
    };
}
