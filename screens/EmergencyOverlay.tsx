
import React, { useEffect, useRef } from 'react';

interface EmergencyOverlayProps {
  aqi: number;
  locationName: string;
  onClose: () => void;
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ aqi, locationName, onClose }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Play a simulated siren alarm
  useEffect(() => {
    const playAlarm = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        
        // siren effect
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.loop = true;
        oscillatorRef.current = oscillator;
        
        // Loop the frequency ramp
        const interval = setInterval(() => {
          if (audioCtx.state === 'running') {
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);
          }
        }, 1000);
        
        return interval;
      } catch (e) {
        console.warn("Audio alarm could not start:", e);
      }
    };

    const intervalId = playAlarm();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (oscillatorRef.current) oscillatorRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=800&h=1200)' }}>
      {/* iOS Status Bar */}
      <div className="w-full flex justify-between items-center px-8 pt-12 pb-2 text-white">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex gap-2">
          <span className="material-symbols-outlined text-[18px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[18px]">wifi</span>
          <span className="material-symbols-outlined text-[18px]">battery_full</span>
        </div>
      </div>

      {/* Lock Screen Time */}
      <div className="mt-12 text-center text-white">
        <p className="text-lg font-medium opacity-90">Emergency Alert Active</p>
        <h1 className="text-8xl font-bold tracking-tight">09:41</h1>
        <div className="mt-4 flex justify-center">
          <span className="material-symbols-outlined text-2xl opacity-60 animate-pulse">lock</span>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="w-full max-w-[380px] px-4 mt-10">
        <div className="bg-[#2d1414]/90 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border-l-[6px] border-red-600 border border-white/20 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded-xl p-1.5 size-9 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-[20px] fill-icon">airwave</span>
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-white/80">AirGuard System Alert</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <span className="material-symbols-outlined text-[20px] animate-ping">volume_up</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Alarm Active</span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col flex-1">
              <h2 className="text-red-500 text-lg font-black leading-tight mb-2 uppercase tracking-tight">
                HAZARDOUS AIR DETECTED
              </h2>
              <p className="text-sm text-white/95 leading-relaxed">
                AQI in <span className="text-red-400 font-bold">{locationName}</span> has spiked to <span className="font-black text-red-500 underline decoration-2 underline-offset-4">{aqi} (Hazardous)</span>.
              </p>
              <div className="mt-3 bg-red-950/40 p-3 rounded-2xl border border-red-500/20">
                <p className="text-[11px] text-red-200 font-bold leading-snug">
                  • Seek shelter immediately<br/>
                  • Seal all ventilation points<br/>
                  • Activate internal air purifiers
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onClose}
              className="w-full bg-red-600 text-white text-sm font-black py-4 rounded-[1.25rem] flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              CONFIRM SAFETY & DISMISS
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-white/10 text-white/60 text-[10px] font-black py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase tracking-widest"
            >
              Quiet Alarm
            </button>
          </div>
        </div>
      </div>

      {/* Lock Screen Bottom UI */}
      <div className="mt-auto mb-16 w-full flex justify-between px-10 items-end text-white">
        <div className="bg-black/30 backdrop-blur-xl size-14 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
          <span className="material-symbols-outlined">flashlight_on</span>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="w-36 h-1.5 bg-white/40 rounded-full overflow-hidden">
             <div className="h-full bg-red-600 animate-pulse w-full"></div>
          </div>
          <p className="text-[10px] font-black opacity-60 tracking-[0.3em] uppercase">Emergency Mode</p>
        </div>
        <div className="bg-black/30 backdrop-blur-xl size-14 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
          <span className="material-symbols-outlined">sos</span>
        </div>
      </div>

      {/* Floating Indicator */}
      <div className="absolute top-64 right-6">
        <div className="bg-red-600 text-white size-20 rounded-[2rem] flex flex-col items-center justify-center p-2 border-4 border-white shadow-2xl animate-pulse">
          <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-80">AQI</span>
          <span className="text-3xl font-black">{aqi}</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyOverlay;
