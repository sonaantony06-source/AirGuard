
import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-pale-blue-100 px-8 pt-3 pb-8 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[60]">
      <NavButton 
        icon="home" 
        label="HOME" 
        isActive={currentScreen === Screen.DASHBOARD} 
        onClick={() => onNavigate(Screen.DASHBOARD)} 
      />
      <NavButton 
        icon="map" 
        label="MAP" 
        isActive={currentScreen === Screen.MAP} 
        onClick={() => onNavigate(Screen.MAP)} 
      />
      <NavButton 
        icon="analytics" 
        label="STATS" 
        isActive={currentScreen === Screen.CALCULATOR} 
        onClick={() => onNavigate(Screen.CALCULATOR)} 
      />
      <NavButton 
        icon="settings" 
        label="SETTINGS" 
        isActive={currentScreen === Screen.SETTINGS} 
        onClick={() => onNavigate(Screen.SETTINGS)} 
      />
    </nav>
  );
};

const NavButton: React.FC<{ icon: string, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}
  >
    <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{icon}</span>
    <span className="text-[9px] font-bold">{label}</span>
  </button>
);

export default BottomNav;
