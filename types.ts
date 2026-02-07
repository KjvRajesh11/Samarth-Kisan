
export enum CropType {
  RICE = 'Rice',
  WHEAT = 'Wheat',
  COTTON = 'Cotton',
  MAIZE = 'Maize',
  MUSTARD = 'Mustard'
}

export enum CropStage {
  SOWING = 'Sowing',
  GROWTH = 'Vegetative Growth',
  FLOWERING = 'Flowering',
  HARVEST = 'Harvesting'
}

export enum SignalLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  ALERT = 'ALERT'
}

export enum Season {
  KHARIF = 'Kharif',
  RABI = 'Rabi',
  ZAID = 'Zaid'
}

export interface ForecastDay {
  day: string;
  temp: number;
  condition: string;
  risk: 'NORMAL' | 'RAIN_LIKELY' | 'HEAT_RISK' | 'DRY';
}

export interface WeatherData {
  temp: number;
  humidity: number;
  rainForecast: number;
  description: string;
  forecast: ForecastDay[];
}

export interface RuleOutput {
  level: SignalLevel;
  reason: string;
  action: string;
  urgency: string;
  impact?: string;
  consequence?: string;
  timeSensitivity?: string; 
  confidence: 'High' | 'Medium';
  isLowCost: boolean;
  ruleKey?: string; 
}

export interface AlertRecord extends RuleOutput {
  id: string;
  crop: CropType;
  stage: CropStage;
  timestamp: number;
  location: string;
  feedbackGiven?: boolean;
  actionTaken?: 'TAKEN' | 'NOT_TAKEN' | 'PENDING';
}

export interface FarmerProfile {
  crop: CropType;
  stage: CropStage;
  location: string;
  observedIssues: string[];
  sowingDate: string; // ISO String
  season?: Season;
}

export interface StageProgress {
  currentStage: CropStage;
  percent: number;
  daysInCurrent: number;
  nextStage: CropStage | null;
  daysToNext: number;
}

export interface MarketPrice {
  crop: CropType;
  avgPrice: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  unit: string;
  stateReport?: string;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  crop: CropType;
  quantity: number;
  price: number;
  total: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED';
}

export interface AgronomistScanReport {
  diagnosis: string;
  confidence: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionPlan: string[];
  prevention: string;
}

export interface DecisionRule {
  crop: CropType;
  stage: CropStage;
  condition: (weather: { temp: number; humidity: number; rainForecast: number }, issues: string[]) => boolean;
  ruleKey: string;
  isLowCost: boolean;
}
