
import React, { useState, useEffect } from 'react';
import { Screen, ImpactData, FootprintResult, LocationData, User } from './types';
import Dashboard from './screens/Dashboard';
import Calculator from './screens/Calculator';
import Results from './screens/Results';
import Settings from './screens/Settings';
import MapScreen from './screens/MapScreen';
import Profile from './screens/Profile';
import EmergencyOverlay from './screens/EmergencyOverlay';
import BottomNav from './components/BottomNav';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [showEmergency, setShowEmergency] = useState(false);
  const [user, setUser] = useState<User>({
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
    isLoggedIn: true
  });

  const [location, setLocation] = useState<LocationData>({
    name: 'San Francisco, CA',
    aqi: 42,
    pm25: 12.4,
    no2: 8.2,
    lat: 37.7749,
    lng: -122.4194
  });

  const [impactData, setImpactData] = useState<ImpactData>({
    acUnits: 2,
    fanUsage: 8,
    energySource: 'Main Grid (Coal/Gas)',
    co2Rate: 0.45,
    gasLevels: 0
  });

  const [results, setResults] = useState<FootprintResult | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(prev => ({
            ...prev,
            name: `Detected Area (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
            lat: latitude,
            lng: longitude,
          }));
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  useEffect(() => {
    if (location.aqi >= 200) {
      setShowEmergency(true);
    }
  }, [location.aqi]);

  const handleCalculate = (data: ImpactData) => {
    setImpactData(data);
    const acImpact = data.acUnits * 1.5 * data.co2Rate;
    const fanImpact = data.fanUsage * 0.1 * data.co2Rate;
    const total = 2.0 + acImpact + fanImpact;
    
    setResults({
      totalTons: parseFloat(total.toFixed(1)),
      breakdown: {
        acUsage: Math.round((acImpact / total) * 100),
        gasEmissions: Math.round((data.gasLevels / total) * 100) || 15,
        energySource: 100 - (Math.round((acImpact / total) * 100) + 15)
      }
    });
    setCurrentScreen(Screen.RESULTS);
  };

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD:
        return <Dashboard 
          location={location}
          onLocationChange={handleLocationChange}
          onShowEmergency={() => setShowEmergency(true)} 
          onViewImpact={() => setCurrentScreen(Screen.RESULTS)}
          onProfileClick={() => setCurrentScreen(Screen.PROFILE)}
        />;
      case Screen.MAP:
        return <MapScreen 
          currentLocation={location}
          onLocationSelect={(newLoc) => {
            handleLocationChange(newLoc);
            setCurrentScreen(Screen.DASHBOARD);
          }}
        />;
      case Screen.CALCULATOR:
        return <Calculator 
          currentLocationName={location.name}
          initialData={impactData} 
          onCalculate={handleCalculate}
          onLocationChange={handleLocationChange}
          onNavigateToMap={() => setCurrentScreen(Screen.MAP)}
        />;
      case Screen.RESULTS:
        return <Results result={results} onBack={() => setCurrentScreen(Screen.DASHBOARD)} />;
      case Screen.SETTINGS:
        return <Settings />;
      case Screen.PROFILE:
        return <Profile user={user} onBack={() => setCurrentScreen(Screen.DASHBOARD)} />;
      default:
        return <Dashboard 
          location={location}
          onLocationChange={handleLocationChange}
          onShowEmergency={() => setShowEmergency(true)} 
          onViewImpact={() => setCurrentScreen(Screen.RESULTS)} 
          onProfileClick={() => setCurrentScreen(Screen.PROFILE)}
        />;
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-pale-blue-50 overflow-x-hidden">
      <Navbar 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen} 
        user={user}
        onProfileClick={() => setCurrentScreen(Screen.PROFILE)}
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto w-full">
          {renderScreen()}
        </div>
      </main>

      {currentScreen !== Screen.RESULTS && !showEmergency && currentScreen !== Screen.PROFILE && (
        <div className="md:hidden">
          <BottomNav 
            currentScreen={currentScreen} 
            onNavigate={setCurrentScreen} 
          />
        </div>
      )}

      {showEmergency && (
        <EmergencyOverlay 
          aqi={location.aqi} 
          locationName={location.name} 
          onClose={() => setShowEmergency(false)} 
        />
      )}
    </div>
  );
};

export default App;
