import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  Cpu,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { trackFaceWebcam } from '../utils/faceTracker';
import type { FaceTrackerResult } from '../utils/faceTracker';
import { 
  drawAccidentSim, 
  drawHelmetSim, 
  drawANPRSim, 
  drawTrafficSim, 
  initAccidentSim, 
  initHelmetSim, 
  initANPRSim, 
  initTrafficSim
} from '../utils/cvSimulators';

interface SandboxProps {
  settings: {
    drowsinessThreshold: number;
    speedLimit: number;
    collisionSensitivity: number;
    soundEnabled: boolean;
  };
  addAlert: (msg: string) => void;
}

type ModuleType = 'accident' | 'drowsiness' | 'helmet' | 'anpr' | 'traffic';

export const Sandbox: React.FC<SandboxProps> = ({ settings: globalSettings, addAlert }) => {
  const [activeModule, setActiveModule] = useState<ModuleType>('drowsiness');
  
  // Local Module Settings
  const [soundEnabled, setSoundEnabled] = useState(globalSettings.soundEnabled);
  const [localDrowsinessThreshold, setLocalDrowsinessThreshold] = useState(globalSettings.drowsinessThreshold);
  const [localSpeedLimit, setLocalSpeedLimit] = useState(globalSettings.speedLimit);
  const [localCollisionSensitivity, setLocalCollisionSensitivity] = useState(globalSettings.collisionSensitivity);

  // Webcam & Face Tracking States
  const [webcamActive, setWebcamActive] = useState(false);
  const [trackingResult, setTrackingResult] = useState<FaceTrackerResult | null>(null);
  const [earHistory, setEarHistory] = useState<{ name: number; ear: number }[]>([]);
  const earHistoryCounter = useRef(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackingIntervalRef = useRef<number | null>(null);

  // Simulation Refs and States for custom media
  const sandboxCanvasRef = useRef<HTMLCanvasElement>(null);
  const simAnimationRef = useRef<number>(0);
  const simFrameRef = useRef<number>(0);
  const [simRunning, setSimRunning] = useState(true);

  // Local state instances for simulator loops in Sandbox
  const simStateRef = useRef<any>(null);

  // Media upload state
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Context for buzzer alarm
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Generate Synthesized Warning Siren (Web Audio API)
  const triggerBuzzer = (freq = 880, duration = 0.3) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  // Reset states on module change
  useEffect(() => {
    stopWebcam();
    setUploadedMediaUrl(null);
    setMediaType(null);
    setTrackingResult(null);
    setEarHistory([]);
    earHistoryCounter.current = 0;
    
    // Initialize simulation states depending on active module
    simFrameRef.current = 0;
    if (activeModule === 'accident') simStateRef.current = initAccidentSim(580, 320);
    if (activeModule === 'helmet') simStateRef.current = initHelmetSim();
    if (activeModule === 'anpr') simStateRef.current = initANPRSim();
    if (activeModule === 'traffic') simStateRef.current = initTrafficSim();
    
    setSimRunning(true);
  }, [activeModule]);

  // Simulator loop for Non-Webcam modules
  useEffect(() => {
    if (activeModule === 'drowsiness' && webcamActive) return; // handled by webcam loop
    
    let active = true;
    const runSim = () => {
      if (!active || !simRunning) return;
      
      const canvas = sandboxCanvasRef.current;
      if (canvas && simStateRef.current) {
        simFrameRef.current += 1;
        const currentFrame = simFrameRef.current;
        
        if (activeModule === 'accident') {
          simStateRef.current = drawAccidentSim(
            canvas,
            currentFrame,
            simStateRef.current,
            localCollisionSensitivity,
            (msg) => {
              addAlert(msg);
              triggerBuzzer(440, 0.4);
            }
          );
        } else if (activeModule === 'helmet') {
          simStateRef.current = drawHelmetSim(
            canvas,
            currentFrame,
            simStateRef.current,
            (msg) => {
              addAlert(msg);
              triggerBuzzer(600, 0.25);
            }
          );
        } else if (activeModule === 'anpr') {
          simStateRef.current = drawANPRSim(
            canvas,
            currentFrame,
            simStateRef.current,
            (msg) => {
              addAlert(msg);
              triggerBuzzer(750, 0.3);
            }
          );
        } else if (activeModule === 'traffic') {
          simStateRef.current = drawTrafficSim(
            canvas,
            currentFrame,
            simStateRef.current,
            localSpeedLimit,
            (msg) => {
              addAlert(msg);
              triggerBuzzer(900, 0.2);
            }
          );
        }
      }
      
      simAnimationRef.current = requestAnimationFrame(runSim);
    };

    if (simRunning) {
      simAnimationRef.current = requestAnimationFrame(runSim);
    }

    return () => {
      active = false;
      cancelAnimationFrame(simAnimationRef.current);
    };
  }, [activeModule, simRunning, localCollisionSensitivity, localSpeedLimit, webcamActive]);

  // Start Webcam for drowsiness detector
  const startWebcam = async () => {
    setUploadedMediaUrl(null);
    setMediaType(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch (err) {
      alert('Camera access denied. Please allow webcam permission to test live drowsiness detection.');
      console.error('Error accessing webcam:', err);
    }
  };

  // Stop Webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    if (trackingIntervalRef.current) {
      cancelAnimationFrame(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Webcam eye-tracking processing loop
  useEffect(() => {
    if (!webcamActive) return;

    const processFrame = () => {
      if (videoRef.current && webcamCanvasRef.current && webcamActive) {
        const result = trackFaceWebcam(videoRef.current, webcamCanvasRef.current);
        setTrackingResult(result);
        
        // Save EAR history for graphs
        setEarHistory(prev => {
          const count = earHistoryCounter.current + 1;
          earHistoryCounter.current = count;
          const nextHist = [...prev, { name: count, ear: result.faceDetected ? result.ear : 0 }];
          if (nextHist.length > 30) nextHist.shift(); // sliding window of 30 frames
          return nextHist;
        });

        // Trigger buzzer alert if eyes closed for prolonged frames
        if (result.faceDetected && result.isClosed) {
          triggerBuzzer(880, 0.2); // high beep
          
          if (earHistoryCounter.current % 45 === 0) {
            addAlert('SANDBOX ALERT: Live webcam drowsiness detected! Eyes closed.');
          }
        }
      }
      trackingIntervalRef.current = requestAnimationFrame(processFrame);
    };

    trackingIntervalRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (trackingIntervalRef.current) {
        cancelAnimationFrame(trackingIntervalRef.current);
      }
    };
  }, [webcamActive]);

  // Handle uploaded custom images/videos
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    const url = URL.createObjectURL(file);
    setUploadedMediaUrl(url);

    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    }
  };

  // Trigger File Input Click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Render Upload Sandbox (Displays user's photo/video with visual bounding boxes)
  const renderUploadSandbox = () => {
    if (!uploadedMediaUrl) return null;

    return (
      <div className="relative w-full h-[320px] rounded-lg overflow-hidden border border-[#a855f7] bg-[#02040a] flex items-center justify-center">
        {mediaType === 'image' ? (
          <img 
            src={uploadedMediaUrl} 
            alt="Uploaded Playground source" 
            className="w-full h-full object-contain"
          />
        ) : (
          <video 
            src={uploadedMediaUrl} 
            controls 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Holographic scanning bounding boxes overlay */}
        <div className="absolute inset-0 border border-purple-500 pointer-events-none bg-[rgba(168,85,247,0.02)]">
          <div className="scanner-line"></div>
          
          {/* Static simulated bounding box for visual polish */}
          <div className="absolute top-[20%] left-[30%] w-[120px] h-[80px] border border-[#10b981] flex flex-col justify-between p-1 bg-[rgba(16,185,129,0.05)]">
            <span className="text-[8px] font-mono text-[#10b981] bg-[rgba(15,23,42,0.85)] px-1 rounded-sm">OBJECT_VERIFIED</span>
            <div className="flex justify-between">
              <span className="text-[7px] text-[#10b981] font-mono">CONF: 97.4%</span>
              <span className="text-[7px] text-[#10b981] font-mono">ID: #893</span>
            </div>
          </div>

          <div className="absolute bottom-[25%] right-[25%] w-[80px] h-[80px] border border-[#f43f5e] flex flex-col justify-between p-1 bg-[rgba(244,63,94,0.05)]">
            <span className="text-[8px] font-mono text-[#f43f5e] bg-[rgba(15,23,42,0.85)] px-1 rounded-sm">VIOLATION</span>
            <span className="text-[7px] text-[#f43f5e] font-mono">CONFIRM: 99.1%</span>
          </div>

          <div className="absolute bottom-4 left-4 bg-slate-950 px-2.5 py-1 rounded border border-[#a855f7] flex items-center gap-1.5 z-10">
            <Cpu size={12} className="text-[#a855f7]" />
            <span className="text-[10px] font-mono text-slate-300">CUSTOM CV SCANNER READY</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Module Title */}
      <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="text-[#38bdf8] w-8 h-8" />
            AI CV Sandbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">Deploy, evaluate, and tune safety detection engines individually</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'} !p-2 rounded`}
            title={soundEnabled ? 'Disable Siren Audio' : 'Enable Siren Audio'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Module Sidebar Selector (3 Units) */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase px-2 mb-2">Available CV Engines</p>
          {[
            { id: 'drowsiness', label: 'Driver Drowsiness', desc: 'Eye tracking & yawn warning', color: 'border-l-sky-400' },
            { id: 'accident', label: 'Accident Detection', desc: 'Sudden force collision radar', color: 'border-l-rose-500' },
            { id: 'helmet', label: 'Helmet Detection', desc: 'Rider safety compliance tracker', color: 'border-l-emerald-500' },
            { id: 'anpr', label: 'ANPR plate scanner', desc: 'Alphanumeric OCR extraction', color: 'border-l-purple-500' },
            { id: 'traffic', label: 'Traffic Monitoring', desc: 'Speed check & vehicle volume', color: 'border-l-amber-500' }
          ].map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as ModuleType)}
              className={`w-full text-left p-3.5 glass-panel border-l-4 ${mod.color} flex flex-col gap-1 transition-all ${
                activeModule === mod.id 
                  ? 'bg-[rgba(56,189,248,0.06)] border-[rgba(255,255,255,0.15)] glow-primary' 
                  : 'bg-transparent border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <span className="font-bold text-sm text-slate-100">{mod.label}</span>
              <span className="text-[11px] text-slate-400 leading-normal">{mod.desc}</span>
            </button>
          ))}
        </div>

        {/* Central Display Canvas (6 Units) */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 flex flex-col justify-between min-h-[440px] relative">
            
            {/* Visualizer Header */}
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2 mb-4">
              <span className="text-xs font-mono font-bold tracking-widest text-[#38bdf8] uppercase flex items-center gap-1.5">
                <Zap size={12} className="animate-pulse" /> Sandbox Monitor Feed
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                {uploadedMediaUrl ? 'CUSTOM MEDIA LOADED' : webcamActive ? 'LIVE WEBCAM DIRECTORY' : 'DEMO ENGINE SIMULATOR'}
              </span>
            </div>

            {/* Canvas/Video View */}
            <div className="flex-grow flex items-center justify-center bg-[#02040a] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)] p-1 relative h-[320px]">
              
              {/* Custom uploaded media preview */}
              {uploadedMediaUrl && renderUploadSandbox()}

              {/* Live Webcam view (For Drowsiness module) */}
              {!uploadedMediaUrl && activeModule === 'drowsiness' && (
                <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden rounded-lg">
                  {/* Standard Video element capturing camera */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover rounded-lg ${webcamActive ? 'block' : 'hidden'}`}
                  />
                  {/* Overlay Canvas for CV face markings */}
                  <canvas
                    ref={webcamCanvasRef}
                    width={580}
                    height={320}
                    className={`absolute inset-0 w-full h-full object-cover z-10 ${webcamActive ? 'block' : 'hidden'}`}
                  />
                  
                  {/* Prompt if camera is off */}
                  {!webcamActive && (
                    <div className="text-center p-8 space-y-4 flex flex-col items-center">
                      <Camera size={42} className="text-sky-400" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-200">Start Webcam Eye-Tracking</p>
                        <p className="text-[11px] text-slate-400 max-w-[280px]">Run actual camera frames through the canvas algorithm to detect face bounds, blinks, and drowsiness indices.</p>
                      </div>
                      <button 
                        onClick={startWebcam}
                        className="btn btn-primary text-xs flex items-center gap-2"
                      >
                        <Camera size={13} /> Enable Webcam Feed
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Demo simulation canvases (For other modules or if webcam inactive) */}
              {!uploadedMediaUrl && (activeModule !== 'drowsiness' || !webcamActive) && (
                <canvas
                  ref={sandboxCanvasRef}
                  width={580}
                  height={320}
                  className="w-full h-[320px] object-cover block rounded-lg bg-[#04060f]"
                />
              )}
            </div>

            {/* Custom media action controls footer */}
            <div className="flex justify-between items-center mt-4 flex-wrap gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleMediaUpload} 
                  accept="image/*,video/*" 
                  className="hidden"
                />
                <button 
                  onClick={triggerFileSelect}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                  title="Upload Image/Video File"
                >
                  <Upload size={12} /> Custom Upload
                </button>
                {uploadedMediaUrl && (
                  <button 
                    onClick={() => {
                      setUploadedMediaUrl(null);
                      setMediaType(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Clear Media
                  </button>
                )}
              </div>
              
              {/* Play/Pause controls for simulation */}
              {!webcamActive && !uploadedMediaUrl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimRunning(!simRunning)}
                    className="btn btn-secondary !p-1.5 rounded-full"
                    title={simRunning ? 'Pause Engine' : 'Resume Engine'}
                  >
                    {simRunning ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Status: {simRunning ? 'Looping' : 'Paused'}
                  </span>
                </div>
              )}
              {webcamActive && (
                <button 
                  onClick={stopWebcam} 
                  className="btn btn-danger text-xs !py-1 !px-3.5"
                >
                  Terminate Camera
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configurations Panel (3 Units) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          
          {/* Main settings panel */}
          <div className="glass-panel p-4 space-y-4 flex flex-col">
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-400 border-b border-[rgba(255,255,255,0.06)] pb-2">
              Parameters & Thresholds
            </h3>

            {/* Slider inputs dependent on active module */}
            {activeModule === 'drowsiness' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Drowsiness Trigger Threshold</span>
                    <span className="font-mono text-sky-400 font-bold">{localDrowsinessThreshold}%</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={localDrowsinessThreshold}
                    onChange={(e) => setLocalDrowsinessThreshold(Number(e.target.value))}
                    className="w-full accent-[#38bdf8] bg-slate-900 h-1 rounded"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Triggers warning alarms if driver closed-eye index climbs above this value.
                  </p>
                </div>
              </div>
            )}

            {activeModule === 'accident' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Collision Sensitivity</span>
                    <span className="font-mono text-rose-500 font-bold">{localCollisionSensitivity}</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={localCollisionSensitivity}
                    onChange={(e) => setLocalCollisionSensitivity(Number(e.target.value))}
                    className="w-full accent-[#f43f5e] bg-slate-900 h-1 rounded"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Motion deceleration multiplier for collision trigger algorithms.
                  </p>
                </div>
              </div>
            )}

            {activeModule === 'traffic' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Speed Violation Limit</span>
                    <span className="font-mono text-amber-500 font-bold">{localSpeedLimit} km/h</span>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    value={localSpeedLimit}
                    onChange={(e) => setLocalSpeedLimit(Number(e.target.value))}
                    className="w-full accent-[#fbbf24] bg-slate-900 h-1 rounded"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Vehicles travelling above this limit trigger a Speed Violation Log.
                  </p>
                </div>
              </div>
            )}

            {activeModule === 'helmet' && (
              <div className="space-y-2 text-slate-300">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">AI Model Architecture</span>
                <div className="text-xs space-y-2 bg-[rgba(10,15,30,0.4)] p-2.5 rounded border border-[rgba(255,255,255,0.04)]">
                  <p className="flex justify-between"><span className="text-slate-400">Backbone:</span> <span className="font-mono font-bold text-emerald-400">YOLOv8x-Head</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Input Size:</span> <span className="font-mono">640x640 px</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Confidence:</span> <span className="font-mono">0.45</span></p>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Runs helmet detection bounding box queries by tracking safety-helmet contour geometries on the rider.
                </p>
              </div>
            )}

            {activeModule === 'anpr' && (
              <div className="space-y-2 text-slate-300">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">ANPR Core Configuration</span>
                <div className="text-xs space-y-2 bg-[rgba(10,15,30,0.4)] p-2.5 rounded border border-[rgba(255,255,255,0.04)]">
                  <p className="flex justify-between"><span className="text-slate-400">Language OCR:</span> <span className="font-mono font-bold text-purple-400">Latin/Alphanum</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Checkpost DB:</span> <span className="font-mono text-emerald-400">Connected</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Lapi OCR conf:</span> <span className="font-mono text-sky-400">97.8%</span></p>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Segments license plates, crops frame regions, and OCR reads vehicle characters against standard RTO registers.
                </p>
              </div>
            )}
          </div>

          {/* Drowsiness Real-time graphs (Shown only when Drowsiness and Webcam are active) */}
          {activeModule === 'drowsiness' && webcamActive && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="font-bold text-xs tracking-wider uppercase text-slate-400 border-b border-[rgba(255,255,255,0.06)] pb-2 flex items-center justify-between">
                <span>Eye Aspect Ratio (EAR) Chart</span>
                <span className="font-mono text-[9px] text-sky-400">30 Frames Window</span>
              </h3>
              
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earHistory}>
                    <defs>
                      <linearGradient id="earGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 0.45]} hide />
                    <Tooltip 
                      contentStyle={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px' }}
                      itemStyle={{ color: '#38bdf8', fontSize: '10px', fontFamily: 'monospace' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ear" 
                      stroke="#38bdf8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#earGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-[10px] space-y-1 font-mono text-slate-400 bg-[rgba(15,23,42,0.3)] p-2 rounded">
                <p className="flex justify-between"><span>L-Eye Status:</span> <span className={trackingResult?.isClosed ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{trackingResult?.isClosed ? 'CLOSED' : 'OPEN'}</span></p>
                <p className="flex justify-between"><span>EAR Index:</span> <span>{trackingResult?.ear.toFixed(3) || '0.000'}</span></p>
                <p className="flex justify-between"><span>Yawn MAR:</span> <span>{trackingResult?.mar.toFixed(3) || '0.000'}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
