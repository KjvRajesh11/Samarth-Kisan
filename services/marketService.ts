
import { CropType, MarketPrice, Transaction } from '../types';

const PRICES: Record<CropType, MarketPrice> = {
  [CropType.RICE]: { crop: CropType.RICE, avgPrice: 2183, trend: 'UP', unit: 'Quintal' },
  [CropType.WHEAT]: { crop: CropType.WHEAT, avgPrice: 2125, trend: 'STABLE', unit: 'Quintal' },
  [CropType.COTTON]: { crop: CropType.COTTON, avgPrice: 6670, trend: 'DOWN', unit: 'Quintal' },
  [CropType.MAIZE]: { crop: CropType.MAIZE, avgPrice: 1962, trend: 'UP', unit: 'Quintal' },
  [CropType.MUSTARD]: { crop: CropType.MUSTARD, avgPrice: 5450, trend: 'STABLE', unit: 'Quintal' },
};

const STATE_REPORTS: Record<string, string> = {
  punjab: "Punjab Market: Mandi arrivals peaked in Ludhiana and Bhatinda. Government procurement centers are active. Grain moisture content is strictly being monitored (Max 14%). High demand for basmati in private markets.",
  haryana: "Haryana Market: Strong demand from rice millers in Karnal and Kurukshetra. Wheat procurement prices remain stable. Cotton arrivals starting to slow in Sirsa; wait for better price windows.",
  maharashtra: "Maharashtra Market: Onion and Tomato prices high in Nashik. Cotton trading active in Jalgaon. Vidarbha cotton quality is slightly affected by unseasonal heat. Check Mandi prices before selling.",
  andhra: "Andhra Pradesh Market: Nellore rice millers requesting higher volume. Heavy rainfall in coastal belt might delay harvest transport. Market arrivals expected to spike by 15% next week.",
  kerala: "Kerala Market: Plantation commodities like cardamom and rubber seeing export demand. Local vegetable markets in Ernakulam show price stability. Logistics in Idukki affected by terrain.",
  karnataka: "Karnataka Market: Maize demand up by 10% due to poultry feed requirements in Mysore region. Ragi and Silk cocoon markets stable. Prices in Davangere showing an upward trend.",
  default: "General Market: Commodity prices showing standard seasonal fluctuations. Mandi arrivals are steady. Ensure proper drying of grain to avoid price deductions at procurement centers."
};

export const getMarketPrice = (crop: CropType, location: string): MarketPrice => {
  const base = PRICES[crop];
  const fluctuation = (Math.random() * 40) - 20;
  
  const loc = location.toLowerCase();
  let stateReport = STATE_REPORTS.default;
  if (loc.includes('punjab')) stateReport = STATE_REPORTS.punjab;
  else if (loc.includes('haryana')) stateReport = STATE_REPORTS.haryana;
  else if (loc.includes('maharashtra')) stateReport = STATE_REPORTS.maharashtra;
  else if (loc.includes('andhra') || loc.includes('nellore')) stateReport = STATE_REPORTS.andhra;
  else if (loc.includes('kerala')) stateReport = STATE_REPORTS.kerala;
  else if (loc.includes('karnataka')) stateReport = STATE_REPORTS.karnataka;

  return {
    ...base,
    avgPrice: Math.round(base.avgPrice + fluctuation),
    stateReport
  };
};

const TRANS_KEY = 'samarth_kisan_transactions';

export const saveTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  localStorage.setItem(TRANS_KEY, JSON.stringify([transaction, ...current]));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANS_KEY);
  return data ? JSON.parse(data) : [];
};
