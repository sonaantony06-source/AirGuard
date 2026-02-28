
import React, { useState } from 'react';
import { LocationData } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  location: LocationData;
  onLocationChange: (loc: LocationData) => void;
  onShowEmergency: () => void;
  onViewImpact: () => void;
  onProfileClick: () => void;
}

interface SearchResult {
  title: string;
  uri: string;
}

const Dashboard: React.FC<DashboardProps> = ({ location, onLocationChange, onShowEmergency, onViewImpact, onProfileClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simulating data for current location
        setTimeout(() => {
          onLocationChange({
            name: `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
            lat: latitude,
            lng: longitude,
            aqi: Math.floor(Math.random() * 60) + 10,
            pm25: parseFloat((Math.random() * 15 + 5).toFixed(1)),
            no2: parseFloat((Math.random() * 10 + 2).toFixed(1))
          });
          setIsLocating(false);
          setSearchQuery('');
          setShowResults(false);
        }, 1500);
      },
      (error) => {
        setIsLocating(false);
        alert('Unable to retrieve your location. ' + error.message);
      }
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLocating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using gemini-2.5-flash as it's the required model for googleMaps grounding.
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Locate precise coordinates and place info for: "${searchQuery}". 
                   Return in format: "LOCATION: [Name] | COORDS: [LAT, LNG]"`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedResults: SearchResult[] = chunks
        .filter(c => c.maps)
        .map(c => ({
          title: c.maps.title || "Target Area",
          uri: c.maps.uri
        }));

      setSearchResults(extractedResults);
      setShowResults(extractedResults.length > 0);

      const coordMatch = response.text.match(/COORDS:\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/i);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        onLocationChange({
          name: searchQuery,
          lat,
          lng,
          aqi: Math.floor(Math.random() * 180) + 20,
          pm25: parseFloat((Math.random() * 40 + 5).toFixed(1)),
          no2: parseFloat((Math.random() * 30 + 5).toFixed(1))
        });
        if (extractedResults.length === 0) setShowResults(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLocating(false);
    }
  };

  const selectResult = async (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery(result.title);
    setIsLocating(true);
    
    try {
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(result.title)}`);
      const geoData = await geoResponse.json();
      if (geoData?.[0]) {
        onLocationChange({
          name: result.title,
          lat: parseFloat(geoData[0].lat),
          lng: parseFloat(geoData[0].lon),
          aqi: Math.floor(Math.random() * 180) + 20,
          pm25: parseFloat((Math.random() * 40 + 5).toFixed(1)),
          no2: parseFloat((Math.random() * 30 + 5).toFixed(1))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };

  const aqiColorClass = location.aqi <= 50 ? 'text-aqi-good' : 
                        location.aqi <= 100 ? 'text-aqi-moderate' : 
                        location.aqi <= 200 ? 'text-aqi-unhealthy' : 'text-aqi-severe';

  const aqiBgClass = location.aqi <= 50 ? 'bg-aqi-good/20' : 
                     location.aqi <= 100 ? 'bg-aqi-moderate/20' : 
                     location.aqi <= 200 ? 'bg-aqi-unhealthy/20' : 'bg-aqi-severe/20';

  const aqiBorderClass = location.aqi <= 50 ? 'border-aqi-good/30' : 
                         location.aqi <= 100 ? 'border-aqi-moderate/30' : 
                         location.aqi <= 200 ? 'border-aqi-unhealthy/30' : 'border-aqi-severe/30';

  const aqiLabel = location.aqi <= 50 ? 'Healthy' : 
                   location.aqi <= 100 ? 'Moderate' : 
                   location.aqi <= 200 ? 'Unhealthy' : 'Hazardous';

  const aqiStrokeColor = location.aqi <= 50 ? '#13ec5b' : 
                         location.aqi <= 100 ? '#fde047' : 
                         location.aqi <= 200 ? '#fb923c' : '#ef4444';

  const isHazardous = location.aqi >= 200;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#e0effe] to-[#f0f7ff] p-4 relative">
      {/* Dynamic Hazardous Banner */}
      {isHazardous && (
        <div 
          onClick={onShowEmergency}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-500 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined fill-icon animate-pulse">report</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-80">Severe Alert</span>
              <span className="text-xs font-bold">Hazardous levels detected nearby!</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </div>
      )}

      {/* Header with Google-Style Search */}
      <header className={`flex flex-col pt-6 pb-2 gap-4 relative z-[100] transition-all duration-500 ${isHazardous ? 'mt-12' : ''}`}>
        <div className="flex items-center justify-between px-1 md:hidden">
          <button className="p-2 -ml-2 text-pale-blue-900/70">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">AirGuard</span>
            <div className="flex items-center gap-1">
              <span className={`material-symbols-outlined text-sm text-primary`}>location_on</span>
              <h2 className="text-pale-blue-900 text-sm font-semibold truncate max-w-[180px]">
                {location.name}
              </h2>
            </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="p-2 -mr-2 text-primary hover:bg-primary/5 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </button>
        </div>
        
        <div className="relative max-w-2xl mx-auto w-full">
          <form onSubmit={handleSearch} className="flex items-center bg-white/90 backdrop-blur-2xl rounded-full border border-white shadow-xl p-1.5 pr-3 transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/10">
            <div className="pl-4 pr-3 py-2 flex items-center pointer-events-none">
              <span className={`material-symbols-outlined text-slate-400 ${isLocating ? 'animate-spin' : ''}`}>
                {isLocating ? 'sync' : 'search'}
              </span>
            </div>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 py-2.5" 
              placeholder="Search city, landmark, or area..." 
              type="text" 
              value={searchQuery}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
            <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
            <button 
              type="button" 
              onClick={handleGetLocation}
              className="p-2.5 rounded-full text-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">my_location</span>
            </button>
          </form>

          {/* Autocomplete Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white/98 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-white/80 overflow-hidden py-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-5 pb-2 mb-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</span>
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Powered by Google</span>
              </div>
              {searchResults.map((result, i) => (
                <div key={i} className="flex flex-col">
                  <button 
                    type="button"
                    onClick={() => selectResult(result)}
                    className="w-full px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[20px]">location_on</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-800 truncate">{result.title}</span>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">Verified Place</span>
                    </div>
                  </button>
                  {result.uri && (
                    <a 
                      href={result.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-19 mr-5 mb-2 text-[9px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      View on Google Maps
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className={`flex-1 max-w-6xl mx-auto w-full py-8 transition-opacity duration-300 ${showResults ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: AQI Focus */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full border-[12px] border-white shadow-inner flex items-center justify-center relative bg-white/20 transition-all duration-700 ${isLocating ? 'opacity-30 scale-95 blur-sm' : 'opacity-100'}`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    style={{ color: aqiStrokeColor }}
                    cx="50" cy="50" r="44" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeDasharray="276" 
                    strokeDashoffset={276 - (276 * Math.min(location.aqi, 200) / 200)} 
                    strokeLinecap="round" 
                    strokeWidth="8" 
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center text-center z-10">
                  <span className="text-slate-500 text-[10px] md:text-xs font-bold tracking-tighter uppercase mb-1">Current AQI</span>
                  <h1 className="text-pale-blue-900 text-7xl md:text-8xl font-extrabold tracking-tight">{location.aqi}</h1>
                  <div className={`mt-2 px-4 py-1.5 rounded-full border shadow-sm transition-colors ${aqiBgClass} ${aqiBorderClass}`}>
                    <p className={`text-sm md:text-base font-bold ${aqiColorClass}`}>{aqiLabel}</p>
                  </div>
                </div>
              </div>
              {isLocating && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
                 </div>
              )}
            </div>

            {/* Mini Stats Grid */}
            <div className={`grid grid-cols-2 gap-4 w-full mt-8 transition-all duration-500 ${isLocating ? 'opacity-50 blur-[2px]' : ''}`}>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wide">PM 2.5</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800">{location.pm25}</span>
                  <span className="text-xs text-slate-400 font-medium">µg/m³</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-base">co2</span>
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wide">NO2</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800">{location.no2}</span>
                  <span className="text-xs text-slate-400 font-medium">ppb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Insights & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Daily Impact Card */}
            <div className="bg-white/60 border border-white backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-pale-blue-900 font-black text-2xl tracking-tight leading-tight">Environmental Impact</h3>
                  <p className="text-primary text-xs font-bold mt-1 uppercase tracking-widest">Real-time Carbon Tracking</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <span className="material-symbols-outlined text-2xl">eco</span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-800 tracking-tighter">2.4</span>
                    <span className="text-lg font-bold text-slate-400">kg CO2 / day</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">trending_down</span>
                      -12% VS AVG
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Updated 5m ago</span>
                  </div>
                </div>
                <button 
                  onClick={onViewImpact}
                  className="bg-primary text-white shadow-xl shadow-primary/20 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95"
                >
                  Personalized Tips
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/40 grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport</span>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%]"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Energy</span>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-[40%]"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waste</span>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[20%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Protocols */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHazardous ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>
                    <span className="material-symbols-outlined text-white">
                      {isHazardous ? 'notification_important' : 'security'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">Safety Protocols</h4>
                    <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Emergency Readiness</p>
                  </div>
                </div>
                
                <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md">
                  {isHazardous 
                    ? 'Hazardous air quality detected. Immediate action required. Follow the emergency checklist for your safety.' 
                    : 'Stay prepared for sudden changes in air quality. Our AI-driven protocols guide you through severe conditions.'}
                </p>

                <button 
                  onClick={onShowEmergency}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
                    isHazardous 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40' 
                      : 'bg-white text-slate-900 hover:bg-white/90'
                  }`}
                >
                  {isHazardous ? 'Engage Emergency Mode' : 'View Safety Guide'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
