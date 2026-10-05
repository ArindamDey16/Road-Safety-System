import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Cpu, 
  BarChart2, 
  Settings as SettingsIcon,
  Clock,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Sandbox } from './components/Sandbox';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { RTOLookup } from './components/RTOLookup';

interface AlertItem {
  id: string;
  time: string;
  msg: string;
  type: 'danger' | 'warning' | 'info';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sandbox' | 'analytics' | 'settings' | 'rtoLookup'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Global settings state
  const [settings, setSettings] = useState({
    drowsinessThreshold: 60, // EAR Closed Index threshold
    speedLimit: 80,          // Speed Limit in km/h
    collisionSensitivity: 70,// G-Force detection sensitivity
    soundEnabled: true,      // Play synthesized alarms
    autoSOS: true,           // Automatic SOS dispatch
    notificationEmail: 'control.room@citysafety.gov'
  });

  // Global Alerts Log
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', time: '18:10:02', msg: 'ANPR Logged Clean Vehicle Plate: KA-51-MM-0092', type: 'info' },
    { id: '2', time: '18:12:44', msg: 'ANPR Logged Clean Vehicle Plate: UP-16-BZ-5544', type: 'info' }
  ]);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(
        `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Callback to append a new alert
  const addAlert = (msg: string) => {
    const date = new Date();
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    
    // Categorize alert type based on content
    let type: 'danger' | 'warning' | 'info' = 'info';
    if (msg.includes('COLLISION') || msg.includes('ACCIDENT') || msg.includes('WAKE UP') || msg.includes('WANTED')) {
      type = 'danger';
    } else if (msg.includes('VIOLATION') || msg.includes('ALERT') || msg.includes('WARNING')) {
      type = 'warning';
    }

    setAlerts(prev => {
      // Avoid duplicate logs for the same incident occurring within 3 seconds
      if (prev.length > 0 && prev[0].msg === msg) return prev;
      
      const newAlert: AlertItem = {
        id: Math.random().toString(),
        time: timeStr,
        msg,
        type
      };
      // Keep logs capped at the latest 40 entries
      return [newAlert, ...prev.slice(0, 39)];
    });
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
  };

  // Nav menu items definition
  const menuItems = [
    { id: 'dashboard', label: 'Monitor Grid', icon: LayoutDashboard },
    { id: 'sandbox', label: 'Module Sandbox', icon: Cpu },
    { id: 'rtoLookup', label: 'RTO Challan Search', icon: FileText },
    { id: 'analytics', label: 'Safety Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Config Room', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-[#060813] flex flex-col relative">
      
      {/* Ambient background glows */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Cyber Grid Border (Top glowing line) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#38bdf8] via-[#a855f7] to-[#10b981] shadow-[0_2px_15px_#38bdf8]"></div>

      <div className="flex flex-grow relative">
        
        {/* Navigation Sidebar Drawer */}
        <aside 
          className={`fixed lg:sticky top-0 left-0 h-full w-[260px] bg-[rgba(9,13,26,0.92)] lg:bg-[rgba(9,13,26,0.45)] backdrop-blur-2xl border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between py-6 px-4 z-40 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-8">
            {/* Logo area */}
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-[rgba(56,189,248,0.1)] rounded-xl border border-sky-500/20 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm tracking-wider text-white">ROAD SAFETY</h2>
                <p className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">AI Sentinel</p>
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-[rgba(56,189,248,0.08)] text-[#38bdf8] border border-[rgba(56,189,248,0.2)] shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                        : 'text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer (Clock + Status) */}
          <div className="space-y-4 px-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={14} className="text-slate-500" />
              <span className="text-[11px] font-mono tracking-widest">{currentTime || '18:14:00'}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500 uppercase tracking-wider">Node: Mainframe</span>
              <span className="flex items-center gap-1 text-[#10b981] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span> SECURE
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Header Menu Bar */}
        <div className="lg:hidden fixed top-4 right-4 z-50">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto w-full lg:max-w-[calc(100vw-260px)]">
          {/* Active view renderer */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              settings={settings} 
              addAlert={addAlert} 
              alerts={alerts} 
              clearAlerts={clearAlerts} 
            />
          )}
          {activeTab === 'sandbox' && (
            <Sandbox 
              settings={settings} 
              addAlert={addAlert} 
            />
          )}
          {activeTab === 'analytics' && (
            <Analytics />
          )}
          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              saveSettings={saveSettings} 
            />
          )}
          {activeTab === 'rtoLookup' && (
            <RTOLookup alerts={alerts} />
          )}
        </main>

      </div>
    </div>
  );
}
