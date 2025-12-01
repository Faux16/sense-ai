import { useState } from 'react';
import {
    LayoutDashboard,
    FileSearch,
    Shield,
    Globe,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react';

interface SidebarProps {
    currentSection: string;
    onSectionChange: (section: string) => void;
}

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings', icon: FileSearch },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'network', label: 'Network Map', icon: Globe },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentSection, onSectionChange }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className={`
                ${isCollapsed ? 'w-20' : 'w-64'} 
                bg-black/80 backdrop-blur-lg border-r border-gray-900 
                transition-all duration-300 ease-in-out
                flex flex-col h-screen sticky top-0
            `}
        >
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-900 flex items-center justify-between">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                SENSE
                            </h1>
                            <p className="text-xs text-gray-400">Shadow AI Detection</p>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-xl">S</span>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                transition-all duration-200
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                            )}
                            {!isCollapsed && isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400"></div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Toggle Button */}
            <div className="p-4 border-t border-gray-900">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                        text-gray-400 hover:text-white hover:bg-gray-900/50 transition-all duration-200"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
