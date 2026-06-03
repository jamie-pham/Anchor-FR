// ECMWF Open Data / ERA5 Weather API
// Real API: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m,precipitation&current_weather=true
// (Open-Meteo uses ECMWF IFS model data, free tier)
// Docs: https://open-meteo.com/en/docs

import { WeatherData, Coordinates } from '../../types';

export async function fetchECMWFWeather(location: Coordinates): Promise<WeatherData> {
  // In production:
  // const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m,precipitation,apparent_temperature,uv_index&current_weather=true&windspeed_unit=kmh&forecast_days=2`;
  // const response = await axios.get(url);
  // return transformOpenMeteoResponse(response.data);

  // Mock data representative of an Australian summer day with elevated fire risk
  const mockWeather: WeatherData = {
    temperature: 38.5,
    feelsLike: 41.2,
    humidity: 18,
    windSpeed: 47,
    windDirection: 310, // NW winds (common pre-fire conditions in SE Australia)
    windGust: 68,
    precipitation24h: 0.2,
    uvIndex: 11,
    stormCategory: null,
    stormDistance: null,
    floodGaugeLevel: null,
    floodThreshold: null,
    inFloodPlain: false,
    heatIndexForecast: 6, // hours forecast above 40°C
    weatherCode: 'CLEAR',
    description: 'Hot and dry with strong north-westerly winds',
  };

  return mockWeather;
}
