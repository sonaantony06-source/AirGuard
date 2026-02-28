
import React, { useEffect, useRef, useState } from 'react';
import { LocationData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

// Declare L for Leaflet global from script tag
declare const L: any;

interface MapScreenProps {
  currentLocation: LocationData;
  onLocationSelect: (location: LocationData) => void;
}

interface SearchResult {
  title: string;
  uri: string;
  snippet?: string;
  lat?: number;
  lng?: number;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  precipitation: number;
  condition: string;
  conditionText: string;
}

interface HistoryPoint {
  date: string;
  fullDate: string;
  aqi: number;
  carbon: number;
}

type HistoryViewMode = 'aqi' | 'carbon' | 'both';
type HeatmapMode = 'off' | 'live' | 'historical';

const MapScreen: React.FC<MapScreenProps> = ({ currentLocation, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const selectionMarkerRef = useRef<any>(null);
  const selectionCircleRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number }>({
    lat: currentLocation.lat || 37.7749,
    lng: currentLocation.lng || -122.4194
  });
  const [previewLocation, setPreviewLocation] = useState<LocationData>({
    ...currentLocation,
    carbonIntensity: currentLocation.carbonIntensity || 450
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Heatmap State
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('live');
  const [heatmapDate, setHeatmapDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Weather state
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<HistoryViewMode>('both');
  const [historicalData, setHistoricalData] = useState<HistoryPoint[]>([]);
  const [historyBaseDate, setHistoryBaseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Helper to get theme based on AQI
  const getAqiTheme = (aqi: number) => {
    if (aqi <= 50) return { color: '#10b981', label: 'Healthy', bg: 'bg-emerald-500', text: 'text-emerald-500' };
    if (aqi <= 100) return { color: '#f59e0b', label: 'Moderate', bg: 'bg-amber-500', text: 'text-amber-500' };
    if (aqi <= 200) return { color: '#f97316', label: 'Unhealthy', bg: 'bg-orange-500', text: 'text-orange-500' };
    return { color: '#e11d48', label: 'Hazardous', bg: 'bg-rose-600', text: 'text-rose-600' };
  };

  const generateHistory = (currentAqi: number, currentCarbon: number, baseDateStr: string) => {
    const data: HistoryPoint[] = [];
    const baseDate = new Date(baseDateStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const isToday = i === 0;
      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi: isToday ? currentAqi : Math.max(10, Math.floor(currentAqi + (Math.random() - 0.5) * 80)),
        carbon: isToday ? currentCarbon : Math.max(50, Math.floor(currentCarbon + (Math.random() - 0.5) * 150))
      });
    }
    setHistoricalData(data);
  };

  const fetchWeather = async (lat: number, lng: number) => {
    setIsFetchingWeather(true);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&wind_speed_unit=ms`);
      const data = await response.json();
      
      if (data.current) {
        setWeatherData({
          temp: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m, 
          wind: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          condition: getWeatherIcon(data.current.weather_code),
          conditionText: getWeatherConditionText(data.current.weather_code)
        });
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'cloud';
    if (code <= 48) return 'foggy';
    if (code <= 67) return 'rainy';
    if (code <= 77) return 'ac_unit';
    if (code <= 82) return 'rainy';
    if (code <= 99) return 'thunderstorm';
    return 'wb_cloudy';
  };

  const getWeatherConditionText = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Light Rain';
    if (code <= 77) return 'Snowing';
    if (code <= 82) return 'Heavy Rain';
    if (code <= 99) return 'Stormy';
    return 'Cloudy';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
        mapRef.current.remove();
    }

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([selectedCoords.lat, selectedCoords.lng], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    const theme = getAqiTheme(previewLocation.aqi);

    selectionMarkerRef.current = L.marker([selectedCoords.lat, selectedCoords.lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'selection-marker',
        html: createMarkerHtml(theme.color, previewLocation.aqi, theme.label),
        iconSize: [100, 60],
        iconAnchor: [50, 60]
      })
    }).addTo(mapRef.current);

    selectionCircleRef.current = L.circle([selectedCoords.lat, selectedCoords.lng], {
      color: theme.color,
      fillColor: theme.color,
      fillOpacity: 0.1,
      radius: 1200,
      weight: 1
    }).addTo(mapRef.current);

    mapRef.current.on('click', (e: any) => {
      updateLocation(e.latlng.lat, e.latlng.lng);
      setShowResults(false);
    });

    if (selectionMarkerRef.current) {
        selectionMarkerRef.current.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            updateLocation(lat, lng);
        });
    }

    generateHeatmap(heatmapDate);
    fetchWeather(selectedCoords.lat, selectedCoords.lng);
    generateHistory(previewLocation.aqi, previewLocation.carbonIntensity || 450, historyBaseDate);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      selectionMarkerRef.current = null;
      selectionCircleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clear old heatmap
    if (heatmapLayerRef.current) {
        heatmapLayerRef.current.forEach((layer: any) => layer && layer.remove());
        heatmapLayerRef.current = [];
    }

    if (heatmapMode !== 'off') {
      generateHeatmap(heatmapMode === 'historical' ? heatmapDate : 'live');
    }
  }, [heatmapMode, heatmapDate, selectedCoords]);

  const generateHeatmap = (dateOrLive: string) => {
    if (!mapRef.current) return;
    
    const center = selectedCoords;
    const points = [];
    
    // Deterministic random generator for historical consistency
    const pseudoRandom = (seed: string) => {
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
      return function() {
        h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
        h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
      };
    };

    const rnd = pseudoRandom(dateOrLive + center.lat + center.lng);

    for(let i=0; i<12; i++) {
       const offsetLat = (rnd() - 0.5) * 0.15;
       const offsetLng = (rnd() - 0.5) * 0.15;
       const randomAqi = Math.floor(rnd() * 250);
       const theme = getAqiTheme(randomAqi);
       
       const circle = L.circle([center.lat + offsetLat, center.lng + offsetLng], {
         color: 'transparent',
         fillColor: theme.color,
         fillOpacity: 0.22,
         radius: 4000
       });
       if (mapRef.current) circle.addTo(mapRef.current);
       points.push(circle);
    }
    heatmapLayerRef.current = points;
  };

  const createMarkerHtml = (color: string, aqi: number, label: string) => `
    <div class="marker-info-bubble" style="--marker-color: ${color}">
      <div class="bubble-content">
        <span class="bubble-label">${label}</span>
        <span class="bubble-aqi">${aqi}</span>
      </div>
      <div class="bubble-tail"></div>
    </div>
  `;

  const updateLocation = (lat: number, lng: number, name?: string, shouldPan = false) => {
    if (!mapRef.current) return;
    
    setSelectedCoords({ lat, lng });
    if (selectionMarkerRef.current) selectionMarkerRef.current.setLatLng([lat, lng]);
    if (selectionCircleRef.current) selectionCircleRef.current.setLatLng([lat, lng]);
    if (shouldPan && mapRef.current) mapRef.current.flyTo([lat, lng], 13);
    
    setIsSearching(true);
    fetchWeather(lat, lng);

    setTimeout(() => {
      const mockAqi = Math.floor(Math.random() * 250);
      const theme = getAqiTheme(mockAqi);
      const mockCarbon = Math.floor(Math.random() * 600) + 100;
      
      const newLoc: LocationData = {
        name: name || `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat: lat,
        lng: lng,
        aqi: mockAqi,
        pm25: parseFloat((Math.random() * 30 + 2).toFixed(1)),
        no2: parseFloat((Math.random() * 15 + 1).toFixed(1)),
        carbonIntensity: mockCarbon
      };
      
      setPreviewLocation(newLoc);
      setIsSearching(false);
      generateHistory(mockAqi, mockCarbon, historyBaseDate);

      if (selectionCircleRef.current) selectionCircleRef.current.setStyle({ color: theme.color, fillColor: theme.color });
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.setIcon(L.divIcon({
          className: 'selection-marker',
          html: createMarkerHtml(theme.color, mockAqi, theme.label),
          iconSize: [100, 60],
          iconAnchor: [50, 60]
        }));
        
        const popupContent = `
          <div class="p-3 min-w-[160px] bg-white rounded-xl shadow-xl">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-sm text-primary">analytics</span>
              <span class="text-[9px] font-black uppercase text-slate-400">Regional Analytics</span>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-500 uppercase">Live AQI</span>
                <span class="text-sm font-black ${theme.text}">${mockAqi}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-500 uppercase">Grid CO₂</span>
                <span class="text-sm font-black text-slate-800">${mockCarbon}g</span>
              </div>
            </div>
          </div>
        `;
        selectionMarkerRef.current.bindPopup(popupContent, {
          closeButton: false,
          offset: [0, -40],
          className: 'custom-leaflet-popup'
        }).openPopup();
      }
    }, 800);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsGeocoding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Locate precise coordinates and place details for: "${searchQuery}". Format: "LOCATION: [Name] | COORDS: [LAT, LNG]"`,
        config: { tools: [{ googleMaps: {} }] },
      });

      const coordMatch = response.text.match(/COORDS:\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/i);
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedResults: SearchResult[] = chunks
        .filter(c => c.maps)
        .map(c => ({
          title: c.maps.title || "Found Area",
          uri: c.maps.uri,
          snippet: ""
        }));
      setSearchResults(extractedResults);
      setShowResults(extractedResults.length > 0);

      if (coordMatch && extractedResults.length === 0) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        updateLocation(lat, lng, searchQuery, true);
        setShowResults(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectResult = async (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery(result.title);
    setIsGeocoding(true);
    try {
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(result.title)}`);
      const geoData = await geoResponse.json();
      if (geoData?.[0]) {
        updateLocation(parseFloat(geoData[0].lat), parseFloat(geoData[0].lon), result.title, true);
      }
    } catch (e) { console.error(e); } finally { setIsGeocoding(false); }
  };

  const handleBaseDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setHistoryBaseDate(newDate);
    generateHistory(previewLocation.aqi, previewLocation.carbonIntensity || 450, newDate);
  };

  const toggleHeatmap = () => {
    if (heatmapMode === 'off') setHeatmapMode('live');
    else if (heatmapMode === 'live') setHeatmapMode('historical');
    else setHeatmapMode('off');
  };

  const theme = getAqiTheme(previewLocation.aqi);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Map Control Cluster */}
      <div className="absolute top-24 right-6 z-[20] flex flex-col gap-3">
        <div className="flex flex-col gap-1 items-end">
          <button 
            onClick={toggleHeatmap}
            className={`size-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border-2 ${heatmapMode !== 'off' ? (heatmapMode === 'live' ? 'bg-primary border-white' : 'bg-indigo-600 border-white') : 'bg-white text-slate-800 border-slate-100'}`}
            title="Toggle AQI Heatmap Mode"
          >
            <span className={`material-symbols-outlined ${heatmapMode !== 'off' ? 'text-white' : ''}`}>
              {heatmapMode === 'off' ? 'layers_clear' : (heatmapMode === 'live' ? 'layers' : 'history_toggle_off')}
            </span>
          </button>
          {heatmapMode !== 'off' && (
            <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${heatmapMode === 'live' ? 'bg-primary text-white' : 'bg-indigo-600 text-white'}`}>
              {heatmapMode}
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setShowWeather(!showWeather)}
          className={`size-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border-2 ${showWeather ? 'bg-amber-500 text-white border-white' : 'bg-white text-slate-800 border-slate-100'}`}
          title="Toggle Weather Hub"
        >
          <span className="material-symbols-outlined">{showWeather ? 'cloud_done' : 'wb_sunny'}</span>
        </button>

        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                updateLocation(pos.coords.latitude, pos.coords.longitude, "My Location", true);
              });
            }
          }}
          className="size-12 rounded-2xl bg-white text-slate-800 shadow-2xl border-2 border-slate-100 flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* Floating Header Search */}
      <div className="absolute top-6 left-6 right-20 z-[20]">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-2xl rounded-2xl border border-white shadow-2xl p-1.5 pr-4 transition-all focus-within:ring-4 focus-within:ring-primary/10">
            <div className="pl-4 pr-3 py-2 flex items-center pointer-events-none">
              <span className={`material-symbols-outlined text-slate-400 ${isGeocoding ? 'animate-spin' : ''}`}>
                {isGeocoding ? 'sync' : 'search'}
              </span>
            </div>
            <input 
              type="text"
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 placeholder:text-slate-400 py-3"
              placeholder="Search Google Maps places..."
              value={searchQuery}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
               <div className="px-5 pb-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Map Sources</span>
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Grounded Search</span>
              </div>
              {searchResults.map((result, i) => (
                <div key={i} className="flex flex-col border-b border-slate-50 last:border-0">
                  <button onClick={() => selectResult(result)} className="w-full px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50 text-left transition-colors">
                    <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-800 truncate">{result.title}</span>
                    </div>
                  </button>
                  {result.uri && (
                    <a href={result.uri} target="_blank" rel="noopener noreferrer" className="ml-18 mr-5 mb-3 px-1 py-0.5 text-[9px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      Open in Maps
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Historical Heatmap Date Selection Bar */}
      {heatmapMode === 'historical' && (
        <div className="absolute top-24 left-6 right-24 z-[20] animate-in slide-in-from-top-4 duration-500">
          <div className="bg-indigo-600/95 backdrop-blur-2xl border border-white/20 rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-200">event</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">Historical Snapshot</span>
                <span className="text-xs font-bold leading-none">{new Date(heatmapDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <input 
              type="date" 
              value={heatmapDate}
              onChange={(e) => setHeatmapDate(e.target.value)}
              className="bg-white/10 border-none rounded-lg text-[10px] font-black uppercase px-2 py-1 focus:ring-1 focus:ring-white/40 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Weather Hub Overlay Card */}
      {showWeather && weatherData && (
        <div className="absolute top-44 left-6 z-[20] w-56 bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border border-white animate-in slide-in-from-left-4 duration-500 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Climate Hub</span>
              <div className={`size-10 rounded-2xl flex items-center justify-center bg-amber-500 text-white shadow-lg shadow-amber-500/20`}>
                <span className="material-symbols-outlined text-xl">{weatherData.condition}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(weatherData.temp)}°</span>
                <span className="text-lg font-black text-slate-400">C</span>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tighter">{weatherData.conditionText}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-base">thermometer</span>
                  <span className="text-[11px] font-bold">Feels Like</span>
                </div>
                <span className="text-[11px] font-black text-slate-900">{Math.round(weatherData.feelsLike)}°</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-base">water_drop</span>
                  <span className="text-[11px] font-bold">Humidity</span>
                </div>
                <span className="text-[11px] font-black text-slate-900">{weatherData.humidity}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-base">air</span>
                  <span className="text-[11px] font-bold">Wind</span>
                </div>
                <span className="text-[11px] font-black text-slate-900">{weatherData.wind} m/s</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-base">rainy</span>
                  <span className="text-[11px] font-bold">Precip.</span>
                </div>
                <span className="text-[11px] font-black text-slate-900">{weatherData.precipitation}mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card Drawer */}
      <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 w-[94%] z-[10] transition-all duration-500 ${showResults ? 'translate-y-[150%]' : 'translate-y-0'}`}>
        <div className="bg-white/98 backdrop-blur-3xl rounded-[2.5rem] p-7 shadow-2xl border border-white overflow-hidden relative max-h-[75vh] flex flex-col">
          {isSearching && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
            </div>
          )}

          {/* Toggle Header */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl">
               <button 
                 onClick={() => setShowHistory(false)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Live Data
               </button>
               <button 
                 onClick={() => setShowHistory(true)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 History
               </button>
             </div>
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme.bg} ${theme.bg.replace('bg-', 'bg-opacity-10')} border-white/20`}>
                <span className="text-[10px] font-black text-white uppercase">{theme.label}</span>
             </div>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`size-2 rounded-full ${theme.bg} animate-pulse`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regional Profile</span>
              </div>
              <h3 className="text-slate-900 font-black text-xl leading-tight line-clamp-2 tracking-tight">
                {previewLocation.name}
              </h3>
            </div>
            <div className={`flex flex-col items-center justify-center p-4 rounded-[2rem] shadow-xl border-4 border-white min-w-[85px] ${theme.bg}`}>
              <span className="text-[9px] font-black text-white/60 uppercase leading-none mb-1">AQI</span>
              <span className="text-3xl font-black text-white leading-none">{previewLocation.aqi}</span>
            </div>
          </div>

          {/* Historical Data View */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {showHistory ? (
              <div className="mb-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Analysis Range</span>
                  </div>
                  <input 
                    type="date" 
                    value={historyBaseDate}
                    onChange={handleBaseDateChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">7-Day Trends</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setHistoryViewMode('aqi')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${historyViewMode === 'aqi' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}
                    >AQI Only</button>
                    <button 
                      onClick={() => setHistoryViewMode('both')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${historyViewMode === 'both' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                    >Comparative</button>
                  </div>
                </div>
                
                <div className="h-48 w-full bg-slate-50 rounded-2xl p-2 border border-slate-100 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.color} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={theme.color} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                      />
                      {(historyViewMode === 'aqi' || historyViewMode === 'both') && (
                        <Area 
                          name="Air Quality Index"
                          type="monotone" 
                          dataKey="aqi" 
                          stroke={theme.color} 
                          fillOpacity={1} 
                          fill="url(#colorAqi)" 
                          strokeWidth={3} 
                        />
                      )}
                      {(historyViewMode === 'carbon' || historyViewMode === 'both') && (
                        <Area 
                          name="Carbon Footprint (g)"
                          type="monotone" 
                          dataKey="carbon" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorCarbon)" 
                          strokeWidth={3} 
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 px-1 text-center">Data History Log</span>
                  {historicalData.map((point, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl hover:border-slate-300 transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">{point.fullDate}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{point.date}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[10px] text-slate-400">filter_alt</span>
                              <span className={`text-sm font-black ${getAqiTheme(point.aqi).text}`}>{point.aqi} AQI</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[10px] text-slate-400">eco</span>
                              <span className="text-[10px] font-black text-emerald-600">{point.carbon}g CO₂/kWh</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  )).reverse()}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-5 rounded-[2rem] flex flex-col gap-3 border border-slate-100/50">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">filter_alt</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1">Particulate PM 2.5</span>
                      <span className="text-xl font-black text-slate-800">{previewLocation.pm25} <small className="text-[10px] font-bold text-slate-400 uppercase">µg/m³</small></span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[2rem] flex flex-col gap-3 border border-slate-100/50">
                    <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <span className="material-symbols-outlined text-lg">eco</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1">Local Grid Intensity</span>
                      <span className="text-xl font-black text-slate-800">{previewLocation.carbonIntensity} <small className="text-[10px] font-bold text-slate-400 uppercase">gCO₂/kWh</small></span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Exposure Health Impact</h4>
                    <span className="material-symbols-outlined text-emerald-400">health_and_safety</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-white/90">
                    Based on current levels, outdoor activity is <span className="font-black text-emerald-400">{theme.label === 'Healthy' ? 'Fully Recommended' : 'Somewhat Restricted'}</span>. Ensure air purifiers are active if AQI trends upward.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-50">
            <button 
              onClick={() => onLocationSelect(previewLocation)}
              className="w-full py-5 rounded-[1.8rem] bg-slate-900 text-white font-black text-base shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>Set Global Context</span>
              <span className="material-symbols-outlined text-xl">verified</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .selection-marker { background: transparent; border: none; overflow: visible !important; }
        .marker-info-bubble {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.3));
          animation: drop-marker 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes drop-marker {
          from { transform: translateY(-50px) scale(0.4); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .bubble-content {
          background-color: var(--marker-color);
          border: 3px solid white;
          border-radius: 16px;
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 90px;
          color: white;
        }
        .bubble-label {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          opacity: 0.8;
          line-height: 1;
          margin-bottom: 3px;
        }
        .bubble-aqi {
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        }
        .bubble-tail {
          width: 0; height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 12px solid var(--marker-color);
          margin-top: -1px;
        }
        
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 0;
          border: 1px solid white;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        .custom-leaflet-popup .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MapScreen;
