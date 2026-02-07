
import { WeatherData, ForecastDay } from '../types';

const generateForecast = (baseTemp: number, isCoastal: boolean): ForecastDay[] => {
  const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
  return days.map((day, idx) => {
    const tempVar = Math.floor(Math.random() * 4) - 2;
    const rainChance = Math.random();
    
    let risk: ForecastDay['risk'] = 'NORMAL';
    let condition = 'Clear';

    if (rainChance > 0.7) {
      risk = 'RAIN_LIKELY';
      condition = 'Cloudy / Rain';
    } else if (baseTemp + tempVar > 38) {
      risk = 'HEAT_RISK';
      condition = 'Extreme Heat';
    } else if (Math.random() < 0.2) {
      risk = 'DRY';
      condition = 'Dry Wind';
    }

    return {
      day,
      temp: baseTemp + tempVar,
      condition,
      risk
    };
  });
};

export const getRegionNote = (location: string): string => {
  const loc = location.toLowerCase();
  if (loc.includes('ludhiana') || loc.includes('punjab')) return "High Yield Zone - Continental Climate";
  if (loc.includes('nashik') || loc.includes('maharashtra')) return "Hilly Terrain - High Humidity Zone";
  if (loc.includes('nellore') || loc.includes('andhra') || loc.includes('coastal')) return "Coastal Belt - High Rainfall Risk";
  if (loc.includes('bhatinda') || loc.includes('haryana')) return "Arid Zone - High Temperature Risk";
  if (loc.includes('kerala')) return "Heavy Monsoon Belt";
  return "Standard Agricultural Zone";
};

/**
 * Enhanced weather mock that provides stage-relevant weather.
 * Simulates district-level patterns based on input keywords.
 */
export const fetchWeather = async (location: string): Promise<WeatherData> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const loc = location.toLowerCase();
  
  // Default baseline
  let temp = 28;
  let humidity = 65;
  let rainForecast = 0;
  let description = 'Clear Skies';
  let isCoastal = false;

  // Micro-climate simulation
  if (loc.includes('ludhiana') || loc.includes('punjab') || loc.includes('haryana') || loc.includes('bhatinda')) {
    temp = 20 + Math.floor(Math.random() * 18);
    humidity = 25 + Math.floor(Math.random() * 35);
  } else if (loc.includes('nashik') || loc.includes('maharashtra') || loc.includes('pune')) {
    temp = 24 + Math.floor(Math.random() * 10);
    humidity = 35 + Math.floor(Math.random() * 25);
  } else if (loc.includes('nellore') || loc.includes('andhra') || loc.includes('kerala') || loc.includes('coastal')) {
    temp = 27 + Math.floor(Math.random() * 6);
    humidity = 65 + Math.floor(Math.random() * 25);
    isCoastal = true;
  }

  // Dynamic weather event simulation
  const chance = Math.random();
  if (chance > 0.85) {
    rainForecast = 35 + Math.floor(Math.random() * 40);
    description = 'Storm Warning';
  } else if (chance > 0.7) {
    rainForecast = 5 + Math.floor(Math.random() * 10);
    description = 'Light Showers';
  } else if (chance < 0.1) {
    humidity = 92; 
    description = 'Very Humid';
  }

  return {
    temp,
    humidity,
    rainForecast,
    description,
    forecast: generateForecast(temp, isCoastal)
  };
};

export const getCurrentLocation = (): Promise<string> => {
  return new Promise((resolve) => {
    // Returning blank to let the farmer type manually as per request.
    resolve('');
  });
};
