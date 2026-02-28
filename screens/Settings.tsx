
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-pale-blue-50 dark:bg-background-dark p-4 pt-8">
      <header className="flex items-center justify-between mb-8">
        <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Notification Settings</h2>
      </header>

      <div className="flex flex-col gap-6">
        {/* Emergency Section */}
        <section>
          <h3 className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">emergency_home</span>
            Emergency Hazardous Alerts
          </h3>
          <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-red-100 dark:border-red-900/30">
            <div className="flex items-center justify-between px-4 py-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="text-red-500 bg-red-500/10 size-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined fill-icon">campaign</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">System Notifications</p>
                  <p className="text-slate-500 text-[10px]">Critical safety overrides</p>
                </div>
              </div>
              <Toggle defaultChecked />
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="text-red-500 bg-red-500/10 size-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">volume_up</span>
                </div>
                <p className="text-sm font-semibold">Alert Sound</p>
              </div>
              <select className="bg-pale-blue-50 dark:bg-slate-900 border-none rounded-lg text-sm font-medium py-1 px-3">
                <option>Siren</option>
                <option>Pulse</option>
                <option>Chime</option>
              </select>
            </div>
          </div>
          <p className="px-2 mt-2 text-[10px] text-slate-500 italic">Automatically receive high-priority alerts with sound when your location reaches hazardous AQI levels.</p>
        </section>

        {/* Standard Alerts Section */}
        <section>
          <h3 className="text-slate-500 dark:text-primary/80 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">Standard Alerts</h3>
          <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-black/5">
            <SettingsRow icon="aq" label="AQI Changes" sub="Alerts for category shifts" defaultChecked />
            <SettingsRow icon="co2" label="Weekly Footprint Reports" sub="Summary of carbon trends" defaultChecked />
            <SettingsRow icon="health_and_safety" label="Health Tips" sub="Daily advice based on air data" color="text-green-500" bg="bg-green-500/10" />
          </div>
        </section>

        {/* Quiet Hours Section */}
        <section>
          <h3 className="text-slate-500 dark:text-primary/80 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">Quiet Hours</h3>
          <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-black/5">
            <div className="flex items-center justify-between px-4 py-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="text-indigo-500 bg-indigo-500/10 size-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">bedtime</span>
                </div>
                <p className="text-sm font-semibold">Do Not Disturb</p>
              </div>
              <Toggle defaultChecked />
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500">From</span>
                <div className="bg-pale-blue-50 dark:bg-slate-900 px-3 py-2 rounded-lg flex items-center gap-2 border border-black/5 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  10:00 PM
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] text-slate-500">To</span>
                <div className="bg-pale-blue-50 dark:bg-slate-900 px-3 py-2 rounded-lg flex items-center gap-2 border border-black/5 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  07:00 AM
                </div>
              </div>
            </div>
          </div>
        </section>

        <button className="w-full py-4 mt-4 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20">
          Save Notification Settings
        </button>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ defaultChecked?: boolean }> = ({ defaultChecked }) => (
  <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-gray-200 dark:bg-gray-700 p-0.5 transition-colors has-[:checked]:bg-primary">
    <input defaultChecked={defaultChecked} className="sr-only peer" type="checkbox" />
    <div className="h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-[20px]"></div>
  </label>
);

const SettingsRow: React.FC<{ icon: string, label: string, subText?: string, color?: string, bg?: string, defaultChecked?: boolean }> = ({ icon, label, subText, color = 'text-primary', bg = 'bg-primary/10', defaultChecked }) => (
  <div className="flex items-center justify-between px-4 py-4 border-b border-black/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`${color} ${bg} size-10 rounded-xl flex items-center justify-center`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-slate-500 text-[10px]">{subText}</p>
      </div>
    </div>
    <Toggle defaultChecked={defaultChecked} />
  </div>
);

export default Settings;
