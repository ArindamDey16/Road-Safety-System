import { useEffect, useRef, useState } from 'react';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  TrafficCone
} from 'lucide-react';
import {
  drawAccidentSim,
  drawHelmetSim,
  drawANPRSim,
  drawTrafficSim,
  initAccidentSim,
  initHelmetSim,
  initANPRSim,
  initTrafficSim,
} from '../utils/cvSimulators';
import type {
  AccidentSimState,
  HelmetSimState,
  ANPRSimState,
  TrafficSimState
} from '../utils/cvSimulators';

interface DashboardProps {
  settings: {
    drowsinessThreshold: number;
    speedLimit: number;
    collisionSensitivity: number;
    soundEnabled: boolean;
  };
  addAlert: (msg: string) => void;
  alerts: { id: string; time: string; msg: string; type: 'danger' | 'warning' | 'info' }[];
  clearAlerts: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ settings, addAlert, alerts, clearAlerts }) => {
  // Canvas Refs
  const accidentCanvasRef = useRef<HTMLCanvasElement>(null);
  const helmetCanvasRef = useRef<HTMLCanvasElement>(null);
  const anprCanvasRef = useRef<HTMLCanvasElement>(null);
  const trafficCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animation Frame Refs
  const animationRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);

  // Simulator States
  const [accidentState, setAccidentState] = useState<AccidentSimState | null>(null);
  const [helmetState, setHelmetState] = useState<HelmetSimState | null>(null);
  const [anprState, setAnprState] = useState<ANPRSimState | null>(null);
  const [trafficState, setTrafficState] = useState<TrafficSimState | null>(null);

  // Maximize Feed state
  const [maximizedFeed, setMaximizedFeed] = useState<number | null>(null);

  // Initialize States
  useEffect(() => {
    setAccidentState(initAccidentSim(400, 240));
    setHelmetState(initHelmetSim());
    setAnprState(initANPRSim());
    setTrafficState(initTrafficSim());
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!accidentState || !helmetState || !anprState || !trafficState) return;

    let accState = { ...accidentState };
    let helState = { ...helmetState };
    let anpState = { ...anprState };
    let traState = { ...trafficState };

    const updateFrame = () => {
      frameCounterRef.current += 1;
      const currentFrame = frameCounterRef.current;

      // 1. Accident Detection Cam
      if (accidentCanvasRef.current) {
        accState = drawAccidentSim(
          accidentCanvasRef.current,
          currentFrame,
          accState,
          settings.collisionSensitivity,
          (msg) => addAlert(msg)
        );
      }

      // 2. Helmet Cam
      if (helmetCanvasRef.current) {
        helState = drawHelmetSim(
          helmetCanvasRef.current,
          currentFrame,
          helState,
          (msg) => addAlert(msg)
        );
      }

      // 3. ANPR Checkpost Cam
      if (anprCanvasRef.current) {
        anpState = drawANPRSim(
          anprCanvasRef.current,
          currentFrame,
          anpState,
          (msg) => addAlert(msg)
        );
      }

      // 4. Traffic Flow Cam
      if (trafficCanvasRef.current) {
        traState = drawTrafficSim(
          trafficCanvasRef.current,
          currentFrame,
          traState,
          settings.speedLimit,
          (msg) => addAlert(msg)
        );
      }

      // Sync state variables occasionally to update react telemetry cards
      if (currentFrame % 10 === 0) {
        setAccidentState(accState);
        setHelmetState(helState);
        setAnprState(anpState);
        setTrafficState(traState);
      }

      animationRef.current = requestAnimationFrame(updateFrame);
    };

    animationRef.current = requestAnimationFrame(updateFrame);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [accidentState, helmetState, anprState, trafficState, settings, addAlert]);

  // Derived telemetry metrics
  const activeViolationsCount = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;
  const currentHelmetRate = helmetState 
    ? (helmetState.totalChecked === 0 
      ? 94 
      : Math.round(((helmetState.totalChecked - helmetState.violationsCount) / helmetState.totalChecked) * 100))
    : 92;
  const currentAvgSpeed = trafficState ? trafficState.avgSpeed : 72;
  const currentTrafficCount = trafficState ? trafficState.vehicleCount : 42;

  // Render camera element
  const renderCamera = (id: number, title: string, canvasRef: React.RefObject<HTMLCanvasElement | null>, badgeStyle: string, badgeText: string) => {
    const isMax = maximizedFeed === id;
    const isAnyMax = maximizedFeed !== null;

    if (isAnyMax && !isMax) return null;

    return (
      <div 
        className={`glass-panel flex flex-col relative overflow-hidden transition-all duration-300 ${
          isMax ? 'col-span-12 h-[500px]' : 'col-span-12 md:col-span-6 h-[280px]'
        } ${badgeText.includes('ACCIDENT') && accidentState?.isCrashDetected ? 'alarm-pulse' : ''}`}
      >
        {/* Cam Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,15,30,0.4)] z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-red-500 animate-ping`}></span>
            <span className="font-semibold text-xs tracking-wider text-slate-300 mono-text uppercase">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`status-badge ${badgeStyle}`}>{badgeText}</span>
            <button 
              onClick={() => setMaximizedFeed(isMax ? null : id)} 
              className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded text-slate-400 hover:text-white transition-colors"
              title={isMax ? 'Minimize Feed' : 'Maximize Feed'}
            >
              <Eye size={13} />
            </button>
          </div>
        </div>

        {/* Cam Content Canvas */}
        <div className="flex-grow bg-[#04060f] relative flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={isMax ? 800 : 540}
            height={isMax ? 440 : 230}
            className="w-full h-full object-cover opacity-90 block"
          />
          {/* Cyber scanline filter */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(18,24,38,0.05)] via-transparent to-[rgba(18,24,38,0.08)] pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Top Banner Overview */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-[#38bdf8] w-8 h-8" />
            AI Road Safety System
          </h1>
          <p className="text-slate-400 text-sm mt-1">Multi-Channel Visual Computer Vision Control Room Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500">SYSTEM TELEMETRY STATUS</span>
            <span className="text-[#10b981] font-semibold text-sm flex items-center gap-1">
              <CheckCircle size={14} /> ALL CV MODELS OPERATIONAL
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Alerts */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between h-[115px] border-l-4 border-l-[#f43f5e]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Active Incidents</p>
              <h3 className="text-2xl font-bold mt-1 text-white mono-text">{activeViolationsCount}</h3>
            </div>
            <div className="p-2 rounded bg-[rgba(244,63,94,0.1)] text-[#f43f5e]">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-[#f43f5e] font-medium flex items-center gap-1 mt-2">
            {activeViolationsCount > 0 ? '⚠️ Action Required on Feeds' : '✓ No unresolved incidents'}
          </p>
        </div>

        {/* Card 2: Average Traffic Speed */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between h-[115px] border-l-4 border-l-[#38bdf8]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Average Speedway Speed</p>
              <h3 className="text-2xl font-bold mt-1 text-white mono-text">{currentAvgSpeed} <span className="text-xs text-slate-400">km/h</span></h3>
            </div>
            <div className="p-2 rounded bg-[rgba(56,189,248,0.1)] text-[#38bdf8]">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
            Speed Limit Set: {settings.speedLimit} km/h
          </p>
        </div>

        {/* Card 3: Helmet Compliance */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between h-[115px] border-l-4 border-l-[#10b981]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Helmet Compliance Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-white mono-text">{currentHelmetRate}%</h3>
            </div>
            <div className="p-2 rounded bg-[rgba(16,185,129,0.1)] text-[#10b981]">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-[#10b981] font-medium flex items-center gap-1 mt-2">
            Target Compliance Goal: 95%
          </p>
        </div>

        {/* Card 4: Total Vehicles Tracked */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between h-[115px] border-l-4 border-l-[#a855f7]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Speedway Volume</p>
              <h3 className="text-2xl font-bold mt-1 text-white mono-text">{currentTrafficCount} <span className="text-xs text-slate-400">vehicles</span></h3>
            </div>
            <div className="p-2 rounded bg-[rgba(168,85,247,0.1)] text-[#a855f7]">
              <TrafficCone size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
            Flow Status: <span className="text-[#10b981] font-medium">Fluid</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Cams + Incident Log */}
      <div className="grid grid-cols-12 gap-6">
        {/* CCTV Camera Grid (Left column: 8 or 12 units) */}
        <div className={`grid grid-cols-12 gap-4 ${maximizedFeed !== null ? 'col-span-12' : 'col-span-12 lg:col-span-8'}`}>
          {renderCamera(1, 'CAM-01: Intersection Gate', helmetCanvasRef, 'status-normal', 'HELMET DETECTOR ACTIVE')}
          {renderCamera(2, 'CAM-02: Speedway Sector 4', trafficCanvasRef, 'status-normal', 'TRAFFIC & SPEED MONITOR')}
          {renderCamera(3, 'CAM-03: Tunnel Entrance', accidentCanvasRef, accidentState?.isCrashDetected ? 'status-alert' : 'status-normal', accidentState?.isCrashDetected ? '⚠️ COLLISION WARNING' : 'ACCIDENT RADAR ACTIVE')}
          {renderCamera(4, 'CAM-04: ANPR Checkpost', anprCanvasRef, 'status-normal', 'LICENSE PLATE SCANNER ACTIVE')}
        </div>

        {/* Incident Alerts Board (Right column: 4 units, hide if feed maximized) */}
        {maximizedFeed === null && (
          <div className="col-span-12 lg:col-span-4 flex flex-col h-[580px] glass-panel overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,15,30,0.3)]">
              <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
                <AlertCircle className="text-[#f43f5e] w-4 h-4" /> Live Incident Logs
              </h3>
              <button 
                onClick={clearAlerts}
                className="text-xs text-slate-400 hover:text-white transition-colors bg-[rgba(255,255,255,0.04)] px-2 py-1 rounded border border-[rgba(255,255,255,0.06)] flex items-center gap-1"
              >
                <RefreshCw size={10} /> Clear
              </button>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 py-10 space-y-2">
                  <Shield size={28} className="text-slate-600" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Telemetry Clear</p>
                  <p className="text-[11px] text-slate-500 max-w-[200px]">No safety violations or road accidents detected currently.</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  let border = 'border-[rgba(255,255,255,0.06)]';
                  let bg = 'bg-[rgba(255,255,255,0.01)]';
                  let iconColor = 'text-sky-400';

                  if (alert.type === 'danger') {
                    border = 'border-[rgba(244,63,94,0.3)]';
                    bg = 'bg-[rgba(244,63,94,0.05)]';
                    iconColor = 'text-[#f43f5e]';
                  } else if (alert.type === 'warning') {
                    border = 'border-[rgba(251,191,36,0.3)]';
                    bg = 'bg-[rgba(251,191,36,0.05)]';
                    iconColor = 'text-[#fbbf24]';
                  }

                  return (
                    <div 
                      key={alert.id} 
                      className={`p-3 border rounded-lg ${border} ${bg} transition-all duration-300 flex items-start gap-2.5`}
                    >
                      <span className={`mt-0.5 ${iconColor}`}>
                        <AlertCircle size={15} />
                      </span>
                      <div className="flex-grow space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold tracking-widest uppercase ${iconColor}`}>
                            {alert.type === 'danger' ? 'CRITICAL ALERT' : alert.type === 'warning' ? 'VIOLATION' : 'LOG'}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{alert.time}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-normal">{alert.msg}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
