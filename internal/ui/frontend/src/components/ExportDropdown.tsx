import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Finding } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
    getExecutiveMetrics,
    getComplianceFrameworks,
    generateExecutiveSummary,
    getTopRisks
} from '../lib/executive-insights';

interface ExportDropdownProps {
    findings: Finding[];
}

export default function ExportDropdown({ findings }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(findings);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SENSE_AI_Findings_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setIsOpen(false);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(findings);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Findings");
        XLSX.writeFile(wb, `SENSE_AI_Findings_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsOpen(false);
    };

    const exportToJSON = () => {
        const json = JSON.stringify(findings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SENSE_AI_Findings_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        setIsOpen(false);
    };

    const exportToPDF = async () => {
        const originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'wait';

        try {
            // Get all report data
            const metrics = getExecutiveMetrics(findings);
            const summary = generateExecutiveSummary(findings);
            const topRisks = getTopRisks(findings);
            const complianceFrameworks = getComplianceFrameworks(findings);

            // Create PDF
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 20;
            let currentY = margin + 15;
            let pageNumber = 1;

            // Helper functions
            const addHeader = () => {
                // Header with subtle background
                pdf.setFillColor(248, 250, 252);
                pdf.rect(0, 0, pageWidth, 25, 'F');

                // Top border line
                pdf.setDrawColor(59, 130, 246);
                pdf.setLineWidth(1);
                pdf.line(0, 0, pageWidth, 0);

                // Company branding
                pdf.setFontSize(16);
                pdf.setTextColor(30, 58, 138);
                pdf.setFont('helvetica', 'bold');
                pdf.text('SENSE AI', margin, 12);

                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Executive Security Report', margin, 18);

                // Date
                pdf.setFontSize(8);
                pdf.setTextColor(148, 163, 184);
                const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                pdf.text(dateStr, pageWidth - margin, 15, { align: 'right' });

                // Bottom border
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.5);
                pdf.line(margin, 25, pageWidth - margin, 25);
            };

            const addFooter = () => {
                // Footer divider line
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.5);
                pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

                // Footer content
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Confidential & Proprietary', margin, pageHeight - 8);

                pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

                pdf.text(`© ${new Date().getFullYear()} SENSE AI`, pageWidth - margin, pageHeight - 8, { align: 'right' });
            };

            const checkPageBreak = (space: number) => {
                if (currentY + space > pageHeight - margin - 20) {
                    addFooter();
                    pdf.addPage();
                    pageNumber++;
                    addHeader();
                    currentY = 35;
                }
            };

            const addSectionDivider = () => {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.3);
                pdf.line(margin, currentY, pageWidth - margin, currentY);
                currentY += 8;
            };

            // Add header (white background is default)
            addHeader();
            currentY = 35;

            // Executive Summary
            checkPageBreak(30);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Executive Summary', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 50, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const descLines = pdf.splitTextToSize('This report provides a comprehensive analysis of security threats and AI usage within your enterprise.', pageWidth - 2 * margin - 10);
            descLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 6;

            pdf.setFontSize(10);
            pdf.setTextColor(51, 65, 85);
            pdf.setFont('helvetica', 'normal');
            const summaryLines = pdf.splitTextToSize(summary.overview, pageWidth - 2 * margin - 5);
            summaryLines.forEach((line: string) => {
                checkPageBreak(5);
                pdf.text(line, margin + 5, currentY);
                currentY += 5;
            });
            currentY += 5;

            // Trend analysis
            if (summary.trend) {
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.setFont('helvetica', 'italic');
                const trendLines = pdf.splitTextToSize(summary.trend, pageWidth - 2 * margin - 5);
                trendLines.forEach((line: string) => {
                    checkPageBreak(4);
                    pdf.text(line, margin + 5, currentY);
                    currentY += 4;
                });
            }
            currentY += 8;
            addSectionDivider();

            // Key Metrics
            checkPageBreak(45);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Key Security Metrics', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 55, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const metricsDescLines = pdf.splitTextToSize('Critical security indicators measured across your enterprise infrastructure.', pageWidth - 2 * margin - 5);
            metricsDescLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 6;

            const metricBoxes = [
                { label: 'Overall Risk Score', value: `${metrics.riskScore}/100`, color: metrics.riskScore >= 70 ? [239, 68, 68] : metrics.riskScore >= 40 ? [249, 115, 22] : [16, 185, 129] },
                { label: 'Compliance Score', value: `${metrics.complianceScore}%`, color: metrics.complianceScore >= 80 ? [16, 185, 129] : metrics.complianceScore >= 60 ? [234, 179, 8] : [239, 68, 68] },
                { label: 'Shadow AI Instances', value: metrics.shadowAIInstances.toString(), color: [168, 85, 247] }
            ];

            // Stack metric boxes vertically for portrait mode
            metricBoxes.forEach((metric) => {
                checkPageBreak(28);
                const boxWidth = pageWidth - 2 * margin;

                // Light background with colored left border
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(margin, currentY, boxWidth, 20, 2, 2, 'F');

                // Colored left border accent
                pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
                pdf.rect(margin, currentY, 4, 20, 'F');

                // Outer border
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.5);
                pdf.roundedRect(margin, currentY, boxWidth, 20, 2, 2, 'S');

                // Label on left, value on right
                pdf.setFontSize(9);
                pdf.setTextColor(71, 85, 105);
                pdf.setFont('helvetica', 'bold');
                pdf.text(metric.label, margin + 8, currentY + 12);

                pdf.setFontSize(14);
                pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
                pdf.setFont('helvetica', 'bold');
                pdf.text(metric.value, pageWidth - margin - 8, currentY + 13, { align: 'right' });

                currentY += 24;
            });
            currentY += 8;
            addSectionDivider();

            // Top Risks
            checkPageBreak(30);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top Security Risks', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 52, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const risksDescLines = pdf.splitTextToSize('The most critical security risks identified, prioritized by severity and potential impact.', pageWidth - 2 * margin - 5);
            risksDescLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 8;

            if (topRisks.length === 0) {
                pdf.setFontSize(9);
                pdf.setTextColor(34, 197, 94);
                pdf.text('✓ No critical risks identified. Your security posture is strong.', margin + 5, currentY);
                currentY += 12;
            } else {
                topRisks.slice(0, 5).forEach((risk, idx) => {
                    checkPageBreak(25);

                    // Risk number badge
                    pdf.setFillColor(59, 130, 246);
                    pdf.circle(margin + 8, currentY - 1, 4, 'F');
                    pdf.setFontSize(8);
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(`${idx + 1}`, margin + 8, currentY + 1, { align: 'center' });

                    // Risk title
                    pdf.setFontSize(11);
                    pdf.setTextColor(30, 58, 138);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(risk.title, margin + 15, currentY);
                    currentY += 6;

                    // Impact description
                    pdf.setFontSize(9);
                    pdf.setTextColor(71, 85, 105);
                    pdf.setFont('helvetica', 'normal');
                    const impactLines = pdf.splitTextToSize(`Impact: ${risk.impact}`, pageWidth - 2 * margin - 15);
                    impactLines.forEach((line: string) => {
                        pdf.text(line, margin + 15, currentY);
                        currentY += 4;
                    });

                    currentY += 6;
                });
            }
            currentY += 5;
            addSectionDivider();

            // Findings Breakdown
            checkPageBreak(40);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Security Findings Breakdown', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 70, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const findingsDescLines = pdf.splitTextToSize('Distribution of security findings categorized by severity level.', pageWidth - 2 * margin - 5);
            findingsDescLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 8;

            const severityCounts = {
                critical: findings.filter(f => f.severity >= 0.8).length,
                high: findings.filter(f => f.severity >= 0.7 && f.severity < 0.8).length,
                medium: findings.filter(f => f.severity >= 0.5 && f.severity < 0.7).length,
                low: findings.filter(f => f.severity < 0.5).length
            };

            pdf.setFontSize(11);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Findings: ${findings.length}`, margin, currentY);
            currentY += 10;

            pdf.setFont('helvetica', 'normal');
            const severityItems = [
                { label: 'Critical', count: severityCounts.critical, color: [220, 38, 38], desc: 'Immediate action required' },
                { label: 'High', count: severityCounts.high, color: [249, 115, 22], desc: 'Address within 24 hours' },
                { label: 'Medium', count: severityCounts.medium, color: [234, 179, 8], desc: 'Address within 1 week' },
                { label: 'Low', count: severityCounts.low, color: [34, 197, 94], desc: 'Monitor and review' }
            ];
            severityItems.forEach(item => {
                const barWidth = (item.count / (findings.length || 1)) * (pageWidth - 2 * margin - 60);

                // Severity row
                pdf.setFontSize(10);
                pdf.setTextColor(51, 65, 85);
                pdf.setFont('helvetica', 'bold');
                pdf.text(item.label, margin, currentY);

                // Count
                pdf.setTextColor(100, 116, 139);
                pdf.text(`${item.count}`, margin + 35, currentY);

                // Progress bar background
                pdf.setFillColor(241, 245, 249);
                pdf.rect(margin + 50, currentY - 3, pageWidth - 2 * margin - 60, 5, 'F');

                // Progress bar fill
                if (barWidth > 0) {
                    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
                    pdf.rect(margin + 50, currentY - 3, Math.max(barWidth, 2), 5, 'F');
                }

                currentY += 8;
            });
            currentY += 8;
            addSectionDivider();

            // Compliance Status
            checkPageBreak(35);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Compliance Framework Status', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 75, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const complianceDescLines = pdf.splitTextToSize('Evaluation of compliance with industry-standard security frameworks and regulations.', pageWidth - 2 * margin - 5);
            complianceDescLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 8;

            complianceFrameworks.forEach(framework => {
                checkPageBreak(14);

                const statusColor = framework.status === 'Compliant' ? [34, 197, 94] :
                    framework.status === 'At Risk' ? [234, 179, 8] : [220, 38, 38];

                // Framework name
                pdf.setFontSize(10);
                pdf.setTextColor(30, 58, 138);
                pdf.setFont('helvetica', 'bold');
                pdf.text(framework.name, margin, currentY);
                currentY += 5;

                // Status badge and score
                pdf.setFontSize(9);
                pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`● ${framework.status}`, margin + 5, currentY);

                pdf.setTextColor(100, 116, 139);
                pdf.text(`${framework.score}%`, margin + 40, currentY);
                currentY += 5;

                // Additional details
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`${framework.affectedFindings} findings affecting compliance`, margin + 5, currentY);
                currentY += 10;
            });
            addSectionDivider();

            // Recommendations
            checkPageBreak(30);
            pdf.setFontSize(16);
            pdf.setTextColor(30, 58, 138);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Recommended Actions', margin, currentY);

            // Section underline
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.8);
            pdf.line(margin, currentY + 2, margin + 60, currentY + 2);
            currentY += 10;

            // Section description
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'italic');
            const recsDescLines = pdf.splitTextToSize('Prioritized cybersecurity initiatives to enhance security posture and mitigate identified risks.', pageWidth - 2 * margin - 5);
            recsDescLines.forEach((line: string) => {
                pdf.text(line, margin, currentY);
                currentY += 4;
            });
            currentY += 8;

            summary.recommendations.forEach((rec, idx) => {
                checkPageBreak(12);

                // Numbering
                pdf.setFontSize(10);
                pdf.setTextColor(59, 130, 246);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${idx + 1}.`, margin, currentY);

                // Recommendation text
                pdf.setTextColor(51, 65, 85);
                pdf.setFont('helvetica', 'normal');
                const recLines = pdf.splitTextToSize(rec, pageWidth - 2 * margin - 10);
                recLines.forEach((line: string, lineIdx: number) => {
                    checkPageBreak(5);
                    pdf.text(line, margin + (lineIdx === 0 ? 10 : 10), currentY);
                    currentY += 5;
                });
                currentY += 3;
            });

            // Add final footer
            addFooter();

            // Save PDF
            pdf.save(`SENSE_AI_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF');
        } finally {
            document.body.style.cursor = originalCursor;
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400 transition-colors text-sm font-medium"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        <button
                            onClick={exportToCSV}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <FileText className="w-4 h-4 text-green-400" />
                            Export as CSV
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-500" />
                            Export as Excel
                        </button>
                        <button
                            onClick={exportToJSON}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <FileJson className="w-4 h-4 text-yellow-400" />
                            Export as JSON
                        </button>

                        <button
                            onClick={exportToPDF}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left border-t border-gray-800 mt-1 pt-2"
                        >
                            <div className="w-4 h-4 flex items-center justify-center">
                                <Download className="w-3 h-3 text-red-400" />
                            </div>
                            Export as PDF
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}
