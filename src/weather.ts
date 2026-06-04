import { GeoLocation, WeatherData } from "./types";

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
  );
  const data = await res.json();
  return data.results ?? [];
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&hourly=temperature_2m,weathercode` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` +
    `&timezone=auto&forecast_days=7`
  );
  return res.json();
}

export function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    80: "Slight Showers", 81: "Moderate Showers", 82: "Violent Showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ Hail", 99: "Heavy Thunderstorm",
  };
  return map[code] ?? "Unknown";
}

export function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return "sun";
  if (code === 2 || code === 3) return "cloud";
  if (code >= 45 && code <= 48) return "cloud-fog";
  if (code >= 51 && code <= 67) return "cloud-rain";
  if (code >= 71 && code <= 77) return "snowflake";
  if (code >= 80 && code <= 82) return "cloud-drizzle";
  if (code >= 95) return "cloud-lightning";
  return "sun";
}

export function formatHour(isoTime: string): string {
  const d = new Date(isoTime);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatDay(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function getTemperatureZone(temp: number): "hot" | "mild" | "cool" {
  if (temp > 35) return "hot";
  if (temp >= 30) return "mild";
  return "cool";
}
