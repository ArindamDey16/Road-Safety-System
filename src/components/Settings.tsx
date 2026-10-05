import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Mail, 
  Flame, 
  Check, 
  RotateCcw,
  Bell,
  Cpu
} from 'lucide-react';

interface SettingsProps {
  settings: {
    drowsinessThreshold: number;
    speedLimit: number;
    collisionSensitivity: number;
    soundEnabled: boolean;
    autoSOS: boolean;
    notificationEmail: string;
  };
  saveSettings: (newSettings: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, saveSettings }) => {
  const [drowsinessThreshold, setDrowsinessThreshold] = useState(settings.drowsinessThreshold);
  const [speedLimit, setSpeedLimit] = useState(settings.speedLimit);
  const [collisionSensitivity, setCollisionSensitivity] = useState(settings.collisionSensitivity);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [autoSOS, setAutoSOS] = useState(settings.autoSOS);
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      drowsinessThreshold,
      speedLimit,
      collisionSensitivity,
      soundEnabled,
      autoSOS,
      notificationEmail
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setDrowsinessThreshold(60);
    setSpeedLimit(80);
    setCollisionSensitivity(70);
    setSoundEnabled(true);
    setAutoSOS(true);
    setNotificationEmail('control.room@citysafety.gov');
    
    saveSettings({
      drowsinessThreshold: 60,
      speedLimit: 80,
      collisionSensitivity: 70,
      soundEnabled: true,
      autoSOS: true,
      notificationEmail: 'control.room@citysafety.gov'
    });
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="text-[#38bdf8] w-8 h-8" />
            Control Room Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure threshold indices, safety flags, and siren triggers</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Threshold Configurations */}
        <div className="glass-panel p-5 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-400 border-b border-[rgba(255,255,255,0.06)] pb-2 mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-[#38bdf8]" /> CV Engine Indices
            </h3>
            
            <div className="space-y-5">
              {/* Eye closing drowsiness limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Webcam Drowsiness EAR Index</span>
                  <span className="text-[#38bdf8] font-mono">{drowsinessThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="90" 
                  value={drowsinessThreshold}
                  onChange={(e) => setDrowsinessThreshold(Number(e.target.value))}
                  className="w-full accent-[#38bdf8] bg-slate-900 h-1.5 rounded"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Maximum closed-eye duration percentage permitted before triggering critical buzzer alarms.
                </p>
              </div>

              {/* Speedway speed limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Highway Speed Limit Violator Limit</span>
                  <span className="text-[#fbbf24] font-mono">{speedLimit} km/h</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="120" 
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(Number(e.target.value))}
                  className="w-full accent-[#fbbf24] bg-slate-900 h-1.5 rounded"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Vehicles measured travelling above this threshold in speedway lanes are flagged as speeding violations.
                </p>
              </div>

              {/* Force deceleration sensitivity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Accident Collision Sensitivity</span>
                  <span className="text-[#f43f5e] font-mono">{collisionSensitivity}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={collisionSensitivity}
                  onChange={(e) => setCollisionSensitivity(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] bg-slate-900 h-1.5 rounded"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Adjusts the sudden-stop velocity change ratio indicating a vehicular crash incident.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: System Triggers & Notifications */}
        <div className="glass-panel p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-400 border-b border-[rgba(255,255,255,0.06)] pb-2 flex items-center gap-2">
              <Bell size={14} className="text-[#fbbf24]" /> Trigger Actions & Logs
            </h3>

            {/* Siren toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[rgba(10,15,30,0.4)] border border-[rgba(255,255,255,0.03)] rounded-lg">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 size={13} className="text-sky-400" /> : <VolumeX size={13} className="text-slate-500" />}
                  Buzzer Siren Sound Alert
                </p>
                <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed">
                  Play local browser synthesized audio signals when high severity incidents occur.
                </p>
              </div>
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-sky-400 accent-sky-400 bg-slate-900 border-slate-700"
              />
            </div>

            {/* SOS Dispatch toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[rgba(10,15,30,0.4)] border border-[rgba(255,255,255,0.03)] rounded-lg">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Flame size={13} className="text-rose-500" /> Auto-SOS Dispatcher
                </p>
                <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed">
                  Simulate instant notifications to ambulance and municipal emergency teams during accidents.
                </p>
              </div>
              <input 
                type="checkbox" 
                checked={autoSOS}
                onChange={(e) => setAutoSOS(e.target.checked)}
                className="w-4 h-4 rounded text-sky-400 accent-rose-500 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Notification targets */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mail size={12} className="text-purple-400" /> Automated Incident Log Target
              </label>
              <input 
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="control.room@citysafety.gov"
                className="text-input w-full text-xs font-mono"
                required
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Destination inbox for email reports compiling speed violations and ANPR blacklist events.
              </p>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button 
              type="button" 
              onClick={handleReset}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset defaults
            </button>
            <button 
              type="submit" 
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              {isSaved ? <Check size={12} /> : null}
              {isSaved ? 'Settings Saved' : 'Save Config'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
