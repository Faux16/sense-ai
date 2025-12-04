import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Finding } from '../types';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ExportDropdownProps {
    findings: Finding[];
    elementIdToCapture?: string; // ID of the element to capture for PDF
}

export default function ExportDropdown({ findings, elementIdToCapture }: ExportDropdownProps) {
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
        if (!elementIdToCapture) return;

        const element = document.getElementById(elementIdToCapture);
        if (!element) return;

        const originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'wait';

        try {
            // Use the same robust capture logic as InsightsPanel
            const clone = element.cloneNode(true) as HTMLElement;
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '1200px'; // Wider for dashboard
            wrapper.style.background = '#000000';
            wrapper.style.color = '#ffffff';
            wrapper.style.fontFamily = 'Inter, sans-serif';
            wrapper.style.padding = '40px';
            wrapper.style.zIndex = '-9999';
            wrapper.style.visibility = 'visible';

            // Add Header
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '30px';
            header.style.borderBottom = '1px solid rgba(99, 102, 241, 0.3)';
            header.style.paddingBottom = '20px';

            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${import.meta.env.BASE_URL}logo_collapse.png" style="width: 40px; height: 40px;" />
                    <div>
                        <h1 style="font-size: 24px; font-weight: bold; margin: 0; background: linear-gradient(to right, #818cf8, #c084fc, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">SENSE AI</h1>
                        <p style="font-size: 10px; color: #9ca3af; margin: 0;">Executive Dashboard Report</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <h2 style="font-size: 16px; font-weight: 600; color: #e5e7eb; margin: 0 0 5px 0;">Confidential</h2>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">${new Date().toLocaleDateString()}</p>
                </div>
            `;

            wrapper.appendChild(header);

            // Style clone
            clone.style.background = 'transparent';
            clone.style.padding = '0';
            clone.style.margin = '0';
            clone.style.width = '100%';

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            await new Promise(resolve => setTimeout(resolve, 1000));

            const dataUrl = await toPng(wrapper, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#000000',
            });

            document.body.removeChild(wrapper);

            const tempPdf = new jsPDF();
            const imgProps = tempPdf.getImageProperties(dataUrl);

            const pdf = new jsPDF({
                orientation: 'landscape', // Landscape for dashboard
                unit: 'px',
                format: [imgProps.width, imgProps.height]
            });

            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, imgProps.width, imgProps.height, 'F');
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
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
                        {elementIdToCapture && (
                            <button
                                onClick={exportToPDF}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left border-t border-gray-800 mt-1 pt-2"
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <Download className="w-3 h-3 text-red-400" />
                                </div>
                                Export as PDF
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
