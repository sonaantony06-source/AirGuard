
import React, { useState, useEffect, useRef } from 'react';
import { ImpactData, LocationData, Screen } from '../types';
import { GoogleGenAI } from "@google/genai";

// Declare L for Leaflet global
declare const L: any;

interface CalculatorProps {
  currentLocationName: string;
  initialData: ImpactData;
  onCalculate: (data: ImpactData) => void;
  onLocationChange?: (loc: LocationData) => void;
  onNavigateToMap?: () => void;
}

interface SearchResult {
  title: string;
  uri: string;
  ecoIntensity?: string;
  co2Factor?: number;
  lat?: number;
  lng?: number;
}

const Calculator: React.FC<CalculatorProps> = ({ 
  currentLocationName, 
  initialData, 
  onCalculate, 
  onLocationChange,
  onNavigateToMap 
}) => {
  const [data, setData] = useState<ImpactData>(initialData);
  const [searchQuery, setSearchQuery] = useState(currentLocationName);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);

  // Initialize mini-map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (mapRef.current) {
        mapRef.current.remove();
    }

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: true
    }).setView([37.7749, -122.4194], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    markerRef.current = L.circleMarker([37.7749, -122.4194], {
      radius: 12,
      fillColor: "#3b82f6",
      color: "#fff",
      weight: 4,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(mapRef.current);

    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      applyLocationContext(`Pinned Location`, lat, lng, 0.45, "Manual Pin");
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  const adjustAC = (val: number) => {
    setData(prev => ({ ...prev, acUnits: Math.max(0, prev.acUnits + val) }));
  };

  const updateMap = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
      if (markerRef.current && mapRef.current.hasLayer(markerRef.current)) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  const handleGetLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        applyLocationContext(`My GPS Position`, latitude, longitude, 0.45, "Active Tracking");
        setIsLocating(false);
        setShowResults(false);
      },
      () => setIsLocating(false)
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLocating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find precise coordinates and carbon data for: "${searchQuery}". 
                   Determine regional grid carbon intensity (gCO2/kWh).
                   Format: "LOCATION: [Name] | COORDS: [LAT, LNG] | INTENSITY: [Value] | PROFILE: [Eco Level]"`,
        config: { tools: [{ googleMaps: {} }] },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const co2Match = response.text.match(/INTENSITY:\s*(\d+)/i);
      const profileMatch = response.text.match(/PROFILE:\s*([^|]+)/i);
      const intensityValue = co2Match ? parseInt(co2Match[1]) / 1000 : 0.45;
      const ecoLabel = profileMatch ? profileMatch[1].trim() : "Verified Grid";

      const coordMatch = response.text.match(/COORDS:\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/i);
      let lat = 0, lng = 0;
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lng = parseFloat(coordMatch[2]);
      }

      const extractedResults: SearchResult[] = chunks
        .filter(c => c.maps)
        .map(c => ({ 
          title: c.maps.title || "Target Area", 
          uri: c.maps.uri,
          ecoIntensity: ecoLabel,
          co2Factor: intensityValue,
          lat, lng
        }));

      setSearchResults(extractedResults);
      setShowResults(extractedResults.length > 0);

      if (coordMatch && !showResults) {
        applyLocationContext(searchQuery, lat, lng, intensityValue, ecoLabel);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLocating(false);
    }
  };

  const applyLocationContext = (name: string, lat: number, lng: number, co2Factor: number, profile: string) => {
    setSearchQuery(name);
    onLocationChange?.({
      name,
      lat,
      lng,
      aqi: 45, pm25: 10, no2: 5
    });
    if (lat !== 0 && lng !== 0) updateMap(lat, lng);
    setData(prev => ({ ...prev, co2Rate: co2Factor }));
    setActiveProfile(profile);
  };

  const selectResult = (result: SearchResult) => {
    setShowResults(false);
    applyLocationContext(result.title, result.lat || 0, result.lng || 0, result.co2Factor || 0.45, result.ecoIntensity || "Regional Profile");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* Unified Status Bar & Search Hub */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-2xl border-b border-slate-100 px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm animate-pulse">explore</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Carbon Tracker • Live</span>
            </div>
            {activeProfile && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[10px] text-emerald-600">verified</span>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{activeProfile}</span>
              </div>
            )}
          </div>

          {/* Inline Search in Status Bar */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 pr-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="pl-3 pr-2 py-2 flex items-center">
                <span className={`material-symbols-outlined text-slate-400 text-lg ${isLocating ? 'animate-spin' : ''}`}>
                  {isLocating ? 'sync' : 'location_on'}
                </span>
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 placeholder:text-slate-400 py-2" 
                placeholder="Search area to analyze map..." 
                type="text" 
                value={searchQuery}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={handleGetLocation} className="p-2 text-primary hover:bg-white rounded-xl transition-all active:scale-90">
                <span className="material-symbols-outlined text-lg">my_location</span>
              </button>
            </form>

            {/* Sticky Dropdown Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                {searchResults.map((result, i) => (
                  <button key={i} onClick={() => selectResult(result)} className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 text-left group">
                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-base">push_pin</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-slate-800 truncate">{result.title}</span>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">{result.ecoIntensity}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Map Section - Direct access from typed location */}
      <section className="relative w-full h-[280px] bg-slate-200 overflow-hidden shadow-inner group">
        <div ref={mapContainerRef} className="w-full h-full contrast-[0.95]" />
        
        {/* Map Overlays */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
           <button 
             onClick={onNavigateToMap}
             className="size-10 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center justify-center text-slate-800 shadow-xl border border-white active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined">map</span>
           </button>
        </div>

        <div className="absolute bottom-6 left-6 flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <div className="size-2 rounded-full bg-blue-500 animate-ping"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-lg">Map Tracking Active</span>
           </div>
           <p className="text-[11px] text-white/80 font-bold drop-shadow-md">{currentLocationName}</p>
        </div>
      </section>

      <div className="p-4 pt-8 max-w-lg mx-auto">
        {/* Dynamic Emission Inputs */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-primary text-sm">energy_savings_leaf</span>
            <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-widest opacity-60">Regional Carbon Factors</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-1">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">Grid kgCO2 / kWh</p>
                <input 
                  className="w-full border-none p-0 bg-transparent text-2xl font-black text-slate-800 focus:ring-0" 
                  placeholder="0.0" type="number" step="0.01"
                  value={data.co2Rate || ''}
                  onChange={e => setData(prev => ({ ...prev, co2Rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/5">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${Math.min(data.co2Rate * 120, 100)}%` }}></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-tighter mb-1">Daily Gas Units</p>
              <input 
                className="w-full border-none p-0 bg-transparent text-2xl font-black text-slate-800 focus:ring-0" 
                placeholder="0" type="number"
                value={data.gasLevels || ''}
                onChange={e => setData(prev => ({ ...prev, gasLevels: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </section>

        {/* Energy Consumption Section */}
        <section className="mb-10 p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/30">
          <div className="flex items-center gap-4 mb-10">
            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary border border-white/5">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <div>
               <h3 className="text-lg font-black leading-tight">Consumption Metrics</h3>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">Adjust power inputs</p>
            </div>
          </div>
          
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-wide">AC Units</span>
                <span className="text-[10px] text-white/30 font-medium">Active cooling capacity</span>
              </div>
              <div className="flex items-center gap-5 bg-white/5 rounded-2xl p-2 border border-white/5 shadow-inner">
                <button onClick={() => adjustAC(-1)} className="size-10 flex items-center justify-center rounded-xl bg-white/5 text-white active:scale-90 transition-all hover:bg-white/10">
                  <span className="material-symbols-outlined text-lg">remove</span>
                </button>
                <span className="w-4 text-center font-black text-xl">{data.acUnits}</span>
                <button onClick={() => adjustAC(1)} className="size-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 transition-all">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase tracking-wide">Daily Fan Run</span>
                  <span className="text-[10px] text-white/30">Ventilation and exhaust</span>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-primary font-black text-3xl">{data.fanUsage}</span>
                   <span className="text-[10px] text-white/40 font-black">HRS</span>
                </div>
              </div>
              <input 
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" 
                max="24" min="0" type="range" 
                value={data.fanUsage}
                onChange={e => setData(prev => ({ ...prev, fanUsage: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </section>

        <button 
          onClick={() => onCalculate(data)}
          className="w-full bg-primary text-white font-black text-lg h-18 py-6 rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 transition-transform active:scale-95 group mb-4"
        >
          <span>Process Local Data</span>
          <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">analytics</span>
        </button>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-8">Calculations use regional grid data tracked on map</p>
      </div>
    </div>
  );
};

export default Calculator;
