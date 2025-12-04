import { useState } from 'react';
import {
    LayoutDashboard,
    FileSearch,
    Shield,
    Globe,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
    TrendingUp
} from 'lucide-react';

interface SidebarProps {
    currentSection: string;
    onSectionChange: (section: string) => void;
}

const menuItems = [
    { id: 'executive', label: 'Executive View', icon: TrendingUp },
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
            <div className="p-6 border-b border-gray-900 flex items-center justify-center">
                <img
                    src={`${import.meta.env.BASE_URL}${isCollapsed ? 'logo_collapse.png' : 'logo.png'}`}
                    alt="SenseAI Logo"
                    className={`${isCollapsed ? 'w-10 h-10' : 'w-40 h-auto'} rounded-xl object-contain transition-all duration-300`}
                />
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
