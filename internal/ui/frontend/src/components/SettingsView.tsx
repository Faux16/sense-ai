import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings, Server, Bell, Palette, Database, Info, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsView() {
    const [notifications, setNotifications] = useState(true);
    const [theme, setTheme] = useState('dark');
    const [apiUrl] = useState('http://localhost:8080');

    // System status (mock)
    const systemStatus = {
        backend: true,
        database: true,
        scanner: true,
        uptime: '2h 15m',
    };

    return (
        <div className="space-y-6">
            {/* System Status */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        System Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Backend API</span>
                                {systemStatus.backend ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                            <Badge className={systemStatus.backend ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                {systemStatus.backend ? 'Connected' : 'Disconnected'}
                            </Badge>
                        </div>

                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Database</span>
                                {systemStatus.database ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                            <Badge className={systemStatus.database ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                {systemStatus.database ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Network Scanner</span>
                                {systemStatus.scanner ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                            <Badge className={systemStatus.scanner ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                {systemStatus.scanner ? 'Running' : 'Stopped'}
                            </Badge>
                        </div>

                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                            <div className="text-sm text-gray-400 mb-2">System Uptime</div>
                            <div className="text-2xl font-bold text-indigo-400">{systemStatus.uptime}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div>
                            <div className="font-semibold text-white">Enable Notifications</div>
                            <div className="text-sm text-gray-400 mt-1">Receive alerts for critical findings</div>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-indigo-500' : 'bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="font-semibold text-white mb-3">Severity Threshold</div>
                        <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                            <option value="low">Low and above</option>
                            <option value="medium">Medium and above</option>
                            <option value="high">High and above</option>
                            <option value="critical" selected>Critical only</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Display Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="font-semibold text-white mb-3">Theme</div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-3 rounded-lg border-2 transition-all ${theme === 'dark'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                <div className="text-white font-semibold">Dark</div>
                                <div className="text-xs text-gray-400 mt-1">Current theme</div>
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-3 rounded-lg border-2 transition-all ${theme === 'light'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                <div className="text-white font-semibold">Light</div>
                                <div className="text-xs text-gray-400 mt-1">Coming soon</div>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="font-semibold text-white mb-3">Timezone</div>
                        <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                            <option value="local" selected>Local Time</option>
                            <option value="utc">UTC</option>
                            <option value="est">EST</option>
                            <option value="pst">PST</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* API Configuration */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        API Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="font-semibold text-white mb-3">API Endpoint</div>
                        <input
                            type="text"
                            value={apiUrl}
                            readOnly
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <div className="text-xs text-gray-400 mt-2">Backend API endpoint URL</div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="font-semibold text-white mb-3">Refresh Interval</div>
                        <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                            <option value="1000">1 second</option>
                            <option value="5000" selected>5 seconds</option>
                            <option value="10000">10 seconds</option>
                            <option value="30000">30 seconds</option>
                        </select>
                    </div>

                    <button className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                        Test Connection
                    </button>
                </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-black/80 backdrop-blur-lg border-gray-900">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        About SENSE
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-400">Version</div>
                                <div className="text-white font-semibold">1.0.0</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Build</div>
                                <div className="text-white font-semibold">2024.11.26</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">License</div>
                                <div className="text-white font-semibold">MIT</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Platform</div>
                                <div className="text-white font-semibold">Web</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                        <div className="text-sm text-gray-300">
                            <strong className="text-white">SENSE</strong> - Shadow AI Detection & Network Security Platform
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            Real-time monitoring and detection of unauthorized AI services and network threats.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
