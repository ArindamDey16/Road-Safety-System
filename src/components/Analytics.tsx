import { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  BarChart2, 
  ShieldAlert, 
  Percent
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

// Mock Analytics Data
const dailyTrafficData = [
  { time: '08:00', volume: 1420, avgSpeed: 64, congestion: 35 },
  { time: '10:00', volume: 1890, avgSpeed: 42, congestion: 68 },
  { time: '12:00', volume: 1250, avgSpeed: 70, congestion: 20 },
  { time: '14:00', volume: 1100, avgSpeed: 74, congestion: 18 },
  { time: '16:00', volume: 1680, avgSpeed: 52, congestion: 50 },
  { time: '18:00', volume: 2200, avgSpeed: 38, congestion: 82 },
  { time: '20:00', volume: 1540, avgSpeed: 58, congestion: 45 },
  { time: '22:00', volume: 890, avgSpeed: 78, congestion: 12 }
];

const weeklyHelmetCompliance = [
  { day: 'Mon', compliance: 88, violations: 24 },
  { day: 'Tue', compliance: 90, violations: 21 },
  { day: 'Wed', compliance: 91, violations: 18 },
  { day: 'Thu', compliance: 93, violations: 14 },
  { day: 'Fri', compliance: 94, violations: 12 },
  { day: 'Sat', compliance: 96, violations: 8 },
  { day: 'Sun', compliance: 98, violations: 4 }
];

const safetyIncidentBreakdown = [
  { name: 'Speeding Violations', count: 124, color: '#fbbf24' },
  { name: 'Helmet Violations', count: 97, color: '#f43f5e' },
  { name: 'Drowsy Alerts', count: 42, color: '#38bdf8' },
  { name: 'ANPR Blacklist Matches', count: 15, color: '#a855f7' }
];

const accidentReductionTrends = [
  { month: 'Jan', preAI: 24, postAI: 24 },
  { month: 'Feb', preAI: 28, postAI: 22 },
  { month: 'Mar', preAI: 21, postAI: 14 },
  { month: 'Apr', preAI: 25, postAI: 10 },
  { month: 'May', preAI: 22, postAI: 6 },
  { month: 'Jun', preAI: 26, postAI: 3 }
];

export const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly'>('today');

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#090d16] border border-[rgba(255,255,255,0.1)] p-3 rounded-lg shadow-lg font-mono text-xs">
          <p className="text-slate-400 font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-6">
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="text-[#38bdf8] w-8 h-8" />
            Safety Analytics Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Aggregated historical metrics, road safety indices, and flow volume stats</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-1">
            {[
              { id: 'today', label: '24 Hours' },
              { id: 'weekly', label: '7 Days' },
              { id: 'monthly', label: '30 Days' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeframe === tf.id ? 'bg-[#38bdf8] text-[#000]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary text-xs flex items-center gap-1.5">
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Chart 1: Traffic Flow Volume & Speed Profiles */}
        <div className="col-span-12 lg:col-span-8 glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2 mb-2">
            <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
              <TrendingUp className="text-[#38bdf8] w-4 h-4" /> Hourly Traffic Flow & Congestion Peak
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">SECTOR-4 HIGHWAY FEEDS</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="congestionGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="#64748b" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  name="Vehicle Volume / hr" 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#volumeGlow)" 
                />
                <Area 
                  name="Congestion Index %" 
                  type="monotone" 
                  dataKey="congestion" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#congestionGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 2: Safety incident statistics breakdown */}
        <div className="col-span-12 lg:col-span-4 glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2 mb-2">
            <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
              <ShieldAlert className="text-[#f43f5e] w-4 h-4" /> Incident Breakdowns
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">ALL CHANNELS</span>
          </div>

          {/* Graphical Breakdown Bar list */}
          <div className="flex-grow space-y-4 flex flex-col justify-center">
            {safetyIncidentBreakdown.map((item, idx) => {
              const totalCount = safetyIncidentBreakdown.reduce((sum, current) => sum + current.count, 0);
              const percentage = Math.round((item.count / totalCount) * 100);

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="text-white font-mono">{item.count} <span className="text-slate-500 text-[10px]">({percentage}%)</span></span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.03)] h-2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%`, backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] leading-normal text-slate-400 bg-[rgba(15,23,42,0.3)] p-3 rounded-lg border border-[rgba(255,255,255,0.04)] font-mono">
            <p className="flex justify-between"><span>TOTAL VIOLATIONS:</span> <span className="font-bold text-white">278</span></p>
            <p className="flex justify-between"><span>CRITICAL RESOLVED:</span> <span className="font-bold text-emerald-400">100%</span></p>
          </div>
        </div>

        {/* Chart 3: Weekly Helmet Compliance Success */}
        <div className="col-span-12 lg:col-span-6 glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2 mb-2">
            <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
              <Percent className="text-[#10b981] w-4 h-4" /> Weekly Helmet Compliance Performance
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">CAM-01 INTERSECTION</span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHelmetCompliance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="complianceGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tickLine={false} domain={[50, 100]} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Compliance Rate %" dataKey="compliance" fill="url(#complianceGlow)" stroke="#10b981" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Accident Reduction Trends (AI Success Case Study) */}
        <div className="col-span-12 lg:col-span-6 glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2 mb-2">
            <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
              <Calendar className="text-[#a855f7] w-4 h-4" /> Accident Reduction Mitigation Analysis
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">PRE-INSTALL VS POST-INSTALL AI</span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accidentReductionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="preAIGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="postAIGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  name="Manual Traffic Control Accidents" 
                  type="monotone" 
                  dataKey="preAI" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#preAIGlow)" 
                />
                <Area 
                  name="AI System Active Accidents" 
                  type="monotone" 
                  dataKey="postAI" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#postAIGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
