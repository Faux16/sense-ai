import { Finding } from "../types";
import { Badge } from "./ui/badge";
import { Shield, X } from "lucide-react";

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    findings: Finding[];
}

export default function DrillDownModal({ isOpen, onClose, title, description, findings }: DrillDownModalProps) {
    if (!isOpen) return null;

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return "bg-red-500/20 text-red-400 border-red-500/50";
        if (severity >= 0.5) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
        if (severity >= 0.2) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
        return "bg-green-500/20 text-green-400 border-green-500/50";
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 0.8) return "Critical";
        if (severity >= 0.5) return "High";
        if (severity >= 0.2) return "Medium";
        return "Low";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-4xl max-h-[80vh] bg-gray-950 border border-gray-800 rounded-lg shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-800 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            {title}
                        </h2>
                        {description && <p className="text-gray-400 mt-1">{description}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-800 bg-gray-900/30">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            Showing {findings.length} findings
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="border-red-500/30 text-red-400">
                                {findings.filter(f => f.severity >= 0.8).length} Critical
                            </Badge>
                            <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                                {findings.filter(f => f.severity >= 0.5 && f.severity < 0.8).length} High
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {findings.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No findings match this criteria.
                        </div>
                    ) : (
                        findings.map((finding) => (
                            <div
                                key={finding.id}
                                className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-indigo-500/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(finding.severity)}`}>
                                                {getSeverityLabel(finding.severity)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {finding.type.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(finding.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-gray-200">{finding.details}</h4>
                                        {finding.source && (
                                            <div className="text-sm text-gray-400 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                {finding.source}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                                            ID: {finding.id}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
