import api from "./api";

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "🌧️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"],
};

async function openMeteoGet(baseUrl, params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${baseUrl}?${query}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status}).`);
  }
  return response.json();
}

export function getWeatherCondition(code) {
  const match = WEATHER_CODES[Number(code)];
  if (match) return { condition: match[0], icon: match[1] };
  if (code >= 51 && code <= 57) return { condition: "Drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { condition: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { condition: "Snow", icon: "🌨️" };
  if (code >= 80 && code <= 82) return { condition: "Rain showers", icon: "🌦️" };
  if (code >= 85 && code <= 86) return { condition: "Snow showers", icon: "🌨️" };
  return { condition: "Conditions unavailable", icon: "—" };
}

export function windDirectionLabel(degrees) {
  if (degrees === null || degrees === undefined || Number.isNaN(Number(degrees))) return "—";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(Number(degrees) / 45) % 8];
}

/**
 * Weather & Environmental Intelligence Service
 *
 * Communicates with backend endpoints:
 *   GET       /api/weather/current/{farmId}
 *   GET       /api/weather/forecast/{farmId}
 *   GET       /api/weather/history/{farmId}
 *   POST      /api/weather/observe/{farmId}
 *   GET/POST  /api/weather/alerts/{farmId}
 */
export const weatherService = {
  async getWeather(latitude, longitude) {
    return openMeteoGet(OPEN_METEO_FORECAST_URL, {
      latitude,
      longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,soil_temperature_0cm,soil_moisture_0_to_1cm,vapour_pressure_deficit",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,et0_fao_evapotranspiration",
      timezone: "auto",
      forecast_days: 7,
    });
  },

  async searchLocation(location) {
    const results = await openMeteoGet(OPEN_METEO_GEOCODING_URL, {
      name: location,
      count: 5,
      language: "en",
      format: "json",
    });
    return results.results || [];
  },

  async getAirQuality(latitude, longitude) {
    return openMeteoGet(OPEN_METEO_AIR_QUALITY_URL, {
      latitude,
      longitude,
      current: "pm10,pm2_5,us_aqi",
      timezone: "auto",
    });
  },

  async getCurrent(farmId) {
    const res = await api.get(`/api/weather/current/${farmId}`);
    return res;
  },

  async getForecast(farmId) {
    const res = await api.get(`/api/weather/forecast/${farmId}`);
    return res.data || [];
  },

  async getHistory(farmId) {
    const res = await api.get(`/api/weather/history/${farmId}`);
    return res.data || [];
  },

  async logObservation(farmId, data) {
    const res = await api.post(`/api/weather/observe/${farmId}`, data);
    return res.data;
  },

  async getAlerts(farmId) {
    const res = await api.get(`/api/weather/alerts/${farmId}`);
    return res.data || [];
  },

  async createAlert(farmId, data) {
    const res = await api.post(`/api/weather/alerts/${farmId}`, data);
    return res.data;
  },
};

export default weatherService;
