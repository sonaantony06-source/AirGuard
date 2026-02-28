
import React from 'react';
import { Screen, User } from '../types';

interface NavbarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  user: User;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, user, onProfileClick }) => {
  return (
    <nav className="hidden md:flex sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-pale-blue-100 px-8 py-4 justify-between items-center z-[100] shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(Screen.DASHBOARD)}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-white">air</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tighter text-pale-blue-900 leading-none">AirGuard</span>
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Analytics</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <NavLink 
          label="Dashboard" 
          isActive={currentScreen === Screen.DASHBOARD} 
          onClick={() => onNavigate(Screen.DASHBOARD)} 
        />
        <NavLink 
          label="Air Map" 
          isActive={currentScreen === Screen.MAP} 
          onClick={() => onNavigate(Screen.MAP)} 
        />
        <NavLink 
          label="Calculator" 
          isActive={currentScreen === Screen.CALCULATOR} 
          onClick={() => onNavigate(Screen.CALCULATOR)} 
        />
        <NavLink 
          label="Settings" 
          isActive={currentScreen === Screen.SETTINGS} 
          onClick={() => onNavigate(Screen.SETTINGS)} 
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden lg:block">
          <p className="text-sm font-bold text-pale-blue-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">{user.email}</p>
        </div>
        <button 
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 hover:border-primary transition-all"
        >
          <img 
            src={user.avatar} 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`text-sm font-bold transition-all relative py-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {label}
    {isActive && (
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
    )}
  </button>
);

export default Navbar;
