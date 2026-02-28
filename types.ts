
export enum Screen {
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  CALCULATOR = 'CALCULATOR',
  RESULTS = 'RESULTS',
  SETTINGS = 'SETTINGS',
  EMERGENCY = 'EMERGENCY',
  PROFILE = 'PROFILE'
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

export interface LocationData {
  name: string;
  lat?: number;
  lng?: number;
  aqi: number;
  pm25: number;
  no2: number;
  carbonIntensity?: number; // gCO2/kWh
}

export interface ImpactData {
  acUnits: number;
  fanUsage: number;
  energySource: string;
  co2Rate: number;
  gasLevels: number;
}

export interface FootprintResult {
  totalTons: number;
  breakdown: {
    acUsage: number;
    gasEmissions: number;
    energySource: number;
  };
}

export interface ReductionTip {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: string;
}
