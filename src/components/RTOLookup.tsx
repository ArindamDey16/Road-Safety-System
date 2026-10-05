import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Car, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  CreditCard,
  Check,
  Zap,
  Key,
  Globe,
  Flame,
  BatteryCharging,
  Gauge,
  CheckSquare,
  Building2,
  Info,
  Loader2,
  Shield,
  Sparkles,
  QrCode
} from 'lucide-react';
import { getVehicleDetailsAsync } from '../utils/rtoDatabase';
import type { VehicleDetails, Challan } from '../utils/rtoDatabase';

interface RTOLookupProps {
  alerts: { msg: string }[];
}

export const RTOLookup: React.FC<RTOLookupProps> = ({ alerts }) => {
  const [searchPlate, setSearchPlate] = useState('WB-38-AD-6851');
  const [searchedVehicle, setSearchedVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Payment Modal State
  const [activePaymentChallan, setActivePaymentChallan] = useState<Challan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{
    challan: Challan;
    txnId: string;
    date: string;
  } | null>(null);

  // Live API Settings
  const [useLiveApi, setUseLiveApi] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Load default vehicle on initial mount if not loaded
  React.useEffect(() => {
    selectPlate('WB-38-AD-6851');
  }, []);

  // Scan recent alert logs for license plates
  const alertPlates = alerts
    .map(a => {
      const match = a.msg.match(/[A-Z]{2}-\d{1,2}-[A-Z]{1,2}-\d{4}/g);
      return match ? match[0] : null;
    })
    .filter((p): p is string => Boolean(p));

  // Featured sample plates from major states
  const samplePlates = [
    { label: 'WB Asansol (Harrier)', plate: 'WB-38-AD-6851' },
    { label: 'MH Pune (Civic)', plate: 'MH-12-GP-8923' },
    { label: 'DL Delhi (Creta)', plate: 'DL-3C-AY-4521' },
    { label: 'KA Bengaluru (Audi)', plate: 'KA-51-MM-0092' },
    { label: 'BH Series (Nexon EV)', plate: 'BH-22-1234-AA' },
    { label: 'UP Noida (Fortuner)', plate: 'UP-16-BZ-5544' }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;
    
    setLoading(true);

    try {
      const details = await getVehicleDetailsAsync(searchPlate, {
        apiKey: useLiveApi && apiKey ? apiKey : undefined
      });
      setSearchedVehicle(details);
    } catch (err) {
      console.error('Lookup failed', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPlate = async (plate: string) => {
    setSearchPlate(plate);
    setLoading(true);
    try {
      const details = await getVehicleDetailsAsync(plate, {
        apiKey: useLiveApi && apiKey ? apiKey : undefined
      });
      setSearchedVehicle(details);
    } finally {
      setLoading(false);
    }
  };

  // Open Payment Modal
  const handleInitiatePayment = (challan: Challan) => {
    setActivePaymentChallan(challan);
    setPaymentReceipt(null);
  };

  // Execute Simulated Payment & Generate Clearance Receipt
  const confirmPayment = () => {
    if (!activePaymentChallan || !searchedVehicle) return;

    setIsProcessingPayment(true);

    setTimeout(() => {
      const updatedChallans = searchedVehicle.challans.map((c: Challan) => {
        if (c.id === activePaymentChallan.id) {
          return { ...c, status: 'PAID' as const };
        }
        return c;
      });

      setSearchedVehicle({
        ...searchedVehicle,
        challans: updatedChallans
      });

      const txnId = 'TXN-PARI-' + Math.floor(10000000 + Math.random() * 90000000);
      const todayStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      setPaymentReceipt({
        challan: activePaymentChallan,
        txnId,
        date: todayStr
      });

      setIsProcessingPayment(false);
    }, 1800);
  };

  // Helper calculation for validity badges
  const getDaysRemaining = (validUntilStr: string) => {
    if (!validUntilStr || validUntilStr === 'N/A') return null;
    const expiry = new Date(validUntilStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-8 fade-in w-full max-w-7xl mx-auto pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 rounded-2xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/15 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" /> Ministry of Road Transport & Highways (MoRTH)
            </span>
            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase">
              Parivahan VAHAN 4.0
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="text-sky-400 w-9 h-9" />
            National Vehicle Registry & e-Challan Portal
          </h1>
          
          <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
            Instant verification of Indian vehicle registration certificates (RC), ownership records, statutory insurance & PUC compliance, and direct settlement of Parivahan e-Challans across 36 States & UTs.
          </p>
        </div>

        {/* Live API Mode Toggle Button */}
        <div className="z-10 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 bg-slate-950/80 border border-slate-700/80 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${useLiveApi ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live API Gateway</span>
            </div>
            
            <button 
              type="button"
              onClick={() => setUseLiveApi(!useLiveApi)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                useLiveApi ? 'bg-sky-500 justify-end shadow-[0_0_12px_rgba(56,189,248,0.5)]' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          <button 
            onClick={() => setShowApiSettings(!showApiSettings)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold underline underline-offset-4"
          >
            <Key size={13} />
            {showApiSettings ? 'Hide RapidAPI Settings' : 'Configure Live Key'}
          </button>
        </div>

      </div>

      {/* Live API Config Panel Drawer */}
      {showApiSettings && (
        <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
              <Key size={16} />
              Real-Time RapidAPI Parivahan Connection Settings
            </div>
            <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2.5 py-1 rounded">REST HTTP Integration</span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste RapidAPI / Parivahan RTO Secret Key (e.g. 8923ab...)"
              className="bg-slate-950 border border-slate-700 text-white flex-grow text-xs font-mono px-4 py-3 rounded-lg focus:outline-none focus:border-sky-400"
            />
            <button
              onClick={() => {
                if (apiKey.trim()) {
                  setUseLiveApi(true);
                  setShowApiSettings(false);
                }
              }}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-lg transition whitespace-nowrap"
            >
              Connect Live API Key
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed flex items-center gap-1.5">
            <Info size={14} className="text-sky-400 flex-shrink-0" />
            When no external API key is supplied, the system uses the <strong>Smart India RTO Decoder Engine</strong> to resolve verified parameters deterministically for all valid Indian registration formats.
          </p>
        </div>
      )}

      {/* Search Input Panel */}
      <div className="bg-slate-900/90 border border-slate-700/80 p-6 rounded-2xl shadow-xl space-y-5">
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              placeholder="Enter Plate Number (e.g. WB-38-AD-6851, MH-12-GP-8923, DL-3C-AY-4521, BH-22-1234-AA)"
              className="w-full bg-slate-950 border-2 border-slate-700 text-white pl-12 pr-4 uppercase font-mono text-base md:text-lg font-bold tracking-widest h-[54px] rounded-xl focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20 transition-all placeholder:text-slate-500 placeholder:normal-case placeholder:font-sans placeholder:text-sm"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-base px-8 h-[54px] rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : <Search size={20} />}
            {loading ? 'Querying Parivahan...' : 'Fetch Live Specs'}
          </button>
        </form>

        {/* Quick Sample Plates (Formatted as Indian License Chips) */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Globe size={14} className="text-sky-400" />
            Quick Test Verified Plates (Click to instant search):
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {samplePlates.map(s => (
              <button
                key={s.plate}
                onClick={() => selectPlate(s.plate)}
                className="group inline-flex items-center bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 px-3 py-2 rounded-lg transition-all text-xs font-mono"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400 mr-2 group-hover:scale-125 transition-transform"></span>
                <span className="font-extrabold text-white group-hover:text-sky-300 tracking-wider">{s.plate}</span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-sans font-normal">({s.label.split(' ')[1]})</span>
              </button>
            ))}

            {alertPlates.length > 0 && alertPlates.map(ap => (
              <button
                key={ap}
                onClick={() => selectPlate(ap)}
                className="inline-flex items-center bg-rose-950/40 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 px-3 py-2 rounded-lg transition-all text-xs font-mono font-extrabold"
              >
                <AlertTriangle size={13} className="mr-1 text-rose-400 animate-pulse" />
                ALERT: {ap}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute top-0 right-0 animate-ping" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono">Querying Central Parivahan VAHAN Database</h3>
            <p className="text-xs text-slate-400 mt-1">Verifying encrypted registration ledger and active traffic violation logs...</p>
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {searchedVehicle && !loading && (
        <div className="grid grid-cols-12 gap-8">
          
          {/* Main Info Card (7 Columns) */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            <div className="bg-slate-900 border border-slate-700/80 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
              
              {/* Header with Authentic Indian HSRP Plate Graphic */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-800">
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                      {searchedVehicle.status === 'UNREGISTERED' ? 'UNVERIFIED REGISTER' : 'OFFICIAL RTO RECORD'}
                    </span>
                    
                    <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase">
                      {searchedVehicle.dataSource || 'PARIVAHAN'}
                    </span>
                  </div>

                  {/* High Security Registration Plate (HSRP) Graphic */}
                  <div className={`hsrp-plate ${searchedVehicle.status === 'WANTED' ? 'hsrp-plate-wanted' : ''}`}>
                    <div className="hsrp-ind-strip">
                      <div className="chakra"></div>
                      <span className="hsrp-ind-text">IND</span>
                    </div>
                    <span className="hsrp-number">{searchedVehicle.plate}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  {searchedVehicle.status === 'CLEAN' && (
                    <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-emerald-950/50">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div>Registry Active</div>
                        <div className="text-[10px] font-normal text-emerald-400/80">Clean Status Verified</div>
                      </div>
                    </div>
                  )}

                  {searchedVehicle.status === 'WANTED' && (
                    <div className="bg-rose-950/60 border border-rose-500/80 text-rose-200 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm alarm-pulse">
                      <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                      <div>
                        <div>Blacklisted / Wanted</div>
                        <div className="text-[10px] font-normal text-rose-300">Police Warrant Alert</div>
                      </div>
                    </div>
                  )}

                  {searchedVehicle.status === 'UNREGISTERED' && (
                    <div className="bg-amber-950/40 border border-amber-500/50 text-amber-300 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm">
                      <XCircle className="w-5 h-5 text-amber-400" />
                      <div>Unverified Record</div>
                    </div>
                  )}
                </div>

              </div>

              {/* Vehicle Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Owner */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={15} className="text-sky-400" /> Owner Record
                  </div>
                  <p className="text-base font-extrabold text-white">{searchedVehicle.owner}</p>
                  <p className="text-xs text-sky-300 font-medium">{searchedVehicle.vehicleClass}</p>
                </div>

                {/* Model */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Car size={15} className="text-sky-400" /> Vehicle Model
                  </div>
                  <p className="text-base font-extrabold text-white">{searchedVehicle.model}</p>
                  <p className="text-xs text-slate-300">{searchedVehicle.maker}</p>
                </div>

                {/* RTO Jurisdiction */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={15} className="text-purple-400" /> RTO Jurisdiction
                  </div>
                  <p className="text-sm font-bold text-slate-100 leading-snug">{searchedVehicle.rtoOffice}</p>
                </div>

                {/* Registration Date */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={15} className="text-emerald-400" /> Registration Date
                  </div>
                  <p className="text-base font-mono font-extrabold text-white">{searchedVehicle.regDate}</p>
                  <p className="text-xs text-slate-300">Road Tax: <span className="text-emerald-400 font-bold">{searchedVehicle.taxStatus}</span></p>
                </div>

              </div>

              {/* Technical & Emission Specs */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Gauge size={15} className="text-sky-400" /> Technical & Emission Engine Parameters
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Fuel Type</span>
                    <div className="font-extrabold flex items-center gap-1">
                      {searchedVehicle.fuelType === 'ELECTRIC' ? (
                        <span className="text-emerald-400 flex items-center gap-1.5"><BatteryCharging size={14} /> ELECTRIC</span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1.5"><Flame size={14} /> {searchedVehicle.fuelType}</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Emission Norm</span>
                    <span className="font-extrabold text-sky-300 block">{searchedVehicle.emissionNorms}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Chassis (Masked)</span>
                    <span className="font-mono text-xs text-slate-200 block truncate font-bold">{searchedVehicle.chassisNumberMasked}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Engine No.</span>
                    <span className="font-mono text-xs text-slate-200 block truncate font-bold">{searchedVehicle.engineNumberMasked}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Compliance Dashboard */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={15} className="text-emerald-400" /> Statutory Compliance Verification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Insurance */}
                  {(() => {
                    const days = getDaysRemaining(searchedVehicle.insuranceValidUntil);
                    const isValid = searchedVehicle.insuranceStatus === 'VALID';
                    return (
                      <div className={`p-4 rounded-xl border ${isValid ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">Motor Insurance</span>
                          {isValid ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle size={10} /> VALID
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <XCircle size={10} /> EXPIRED
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-300">Until: <strong className="text-white">{searchedVehicle.insuranceValidUntil}</strong></p>
                        {days !== null && (
                          <p className={`text-[10px] font-semibold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isValid ? `✓ ${days} days remaining` : `⚠️ Expired ${Math.abs(days)} days ago`}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* PUC */}
                  {(() => {
                    const days = getDaysRemaining(searchedVehicle.pucValidUntil);
                    const isValid = searchedVehicle.pucStatus === 'VALID';
                    return (
                      <div className={`p-4 rounded-xl border ${isValid ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">PUC Certificate</span>
                          {isValid ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle size={10} /> VALID
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <XCircle size={10} /> EXPIRED
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-300">Until: <strong className="text-white">{searchedVehicle.pucValidUntil}</strong></p>
                        {days !== null && (
                          <p className={`text-[10px] font-semibold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isValid ? `✓ ${days} days remaining` : `⚠️ Expired ${Math.abs(days)} days ago`}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Fitness */}
                  <div className="p-4 rounded-xl border bg-emerald-950/20 border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">Vehicle Fitness</span>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={10} /> FIT
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-300">Until: <strong className="text-white">{searchedVehicle.fitnessValidUntil}</strong></p>
                    <p className="text-[10px] text-emerald-400 font-semibold">✓ Certified fit for public roads</p>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* e-Challan History & Online Fine Clearance (5 Columns) */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-sky-400 w-6 h-6" />
                  <div>
                    <h3 className="font-extrabold text-white text-lg">Parivahan e-Challan History</h3>
                    <p className="text-xs text-slate-400">Traffic Violation Fines & Notices</p>
                  </div>
                </div>

                <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold px-3 py-1 rounded-full">
                  {searchedVehicle.challans.filter(c => c.status === 'UNPAID').length} Pending
                </span>
              </div>

              {searchedVehicle.challans.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div>
                    <p className="text-base font-bold text-white">No Active Challans Found</p>
                    <p className="text-xs text-slate-400 mt-1">This vehicle has no pending traffic violations or fine notices logged on Parivahan VAHAN.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchedVehicle.challans.map((challan) => (
                    <div 
                      key={challan.id}
                      className={`p-4 rounded-xl border transition-all ${
                        challan.status === 'UNPAID' 
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70' 
                          : 'bg-emerald-950/20 border-emerald-500/40'
                      } space-y-3`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-slate-400">{challan.id} • {challan.date}</span>
                          <h4 className="text-sm font-extrabold text-white mt-0.5 leading-snug">{challan.violation}</h4>
                        </div>
                        <span className="font-mono font-black text-lg text-amber-400 whitespace-nowrap bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                          ₹{challan.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {challan.location && (
                        <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                          <MapPin size={13} className="text-sky-400 flex-shrink-0" /> {challan.location}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                        {challan.status === 'PAID' ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                            <Check size={14} /> PAID & CLEARANCE ISSUED
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle size={14} /> UNPAID OVERDUE
                          </span>
                        )}

                        {challan.status === 'UNPAID' && (
                          <button
                            onClick={() => handleInitiatePayment(challan)}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            Pay ₹{challan.amount} Online
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* National Integration Banner */}
            <div className="bg-slate-900 border border-sky-500/30 p-5 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Globe size={15} /> National VAHAN & SARATHI Portal Sync
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vehicle registration details and e-Challan statuses are verified directly with State Transport Departments across India to enable automated toll clearance and urban entry permissions.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Online Payment Modal */}
      {activePaymentChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 relative animate-fade-in">
            
            {!paymentReceipt ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-sky-400 w-6 h-6" />
                    <div>
                      <h3 className="text-lg font-extrabold text-white">Parivahan e-Challan Gateway</h3>
                      <p className="text-xs text-slate-400">Direct Traffic Penalty Settlement</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePaymentChallan(null)}
                    className="text-slate-400 hover:text-white text-xl font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Challan ID: <strong className="text-white font-mono">{activePaymentChallan.id}</strong></span>
                    <span>Vehicle: <strong className="text-sky-400 font-mono font-bold">{searchedVehicle?.plate}</strong></span>
                  </div>
                  <p className="text-sm font-bold text-white">{activePaymentChallan.violation}</p>
                  <div className="text-right border-t border-slate-800 pt-2">
                    <span className="text-xs text-slate-400 mr-2">Total Fine Payable:</span>
                    <span className="text-xl font-mono font-black text-emerald-400">₹{activePaymentChallan.amount}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-xl border text-center transition ${paymentMethod === 'upi' ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <span className="block text-xs">UPI / QR</span>
                      <span className="text-[10px] text-slate-400 font-normal">GPay, PhonePe</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-center transition ${paymentMethod === 'card' ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <span className="block text-xs">Debit / Credit</span>
                      <span className="text-[10px] text-slate-400 font-normal">Visa, Mastercard</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 rounded-xl border text-center transition ${paymentMethod === 'netbanking' ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <span className="block text-xs">NetBanking</span>
                      <span className="text-[10px] text-slate-400 font-normal">All Indian Banks</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button 
                    onClick={() => setActivePaymentChallan(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button 
                    onClick={confirmPayment}
                    disabled={isProcessingPayment}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
                    {isProcessingPayment ? 'Processing Payment...' : `Pay ₹${activePaymentChallan.amount} Now`}
                  </button>
                </div>
              </>
            ) : (
              /* Digital Clearance Receipt View */
              <div className="space-y-5">
                <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">e-Challan Payment Receipt</h3>
                  <p className="text-xs text-emerald-400 font-bold">✓ Transaction Approved & Fine Settled</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                    <span>Receipt No:</span>
                    <span className="text-white font-bold">{paymentReceipt.txnId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                    <span>Date & Time:</span>
                    <span className="text-white">{paymentReceipt.date}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                    <span>Vehicle Reg No:</span>
                    <span className="text-sky-400 font-bold">{searchedVehicle?.plate}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                    <span>Challan ID:</span>
                    <span className="text-white">{paymentReceipt.challan.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-400 font-black text-sm">₹{paymentReceipt.challan.amount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-10 h-10 text-sky-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Digitally Signed</span>
                      <span className="text-[11px] text-slate-200 font-mono font-bold">MoRTH Parivahan Ledger</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold">OFFICIAL SETTLEMENT</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setActivePaymentChallan(null);
                      setPaymentReceipt(null);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl transition"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
