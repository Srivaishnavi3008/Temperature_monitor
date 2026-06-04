import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, MapPin, Thermometer, Wind, Droplets, Eye, Sun, Cloud,
  CloudRain, CloudSnow, CloudLightning, RefreshCw, AlertTriangle,
  TrendingUp, TrendingDown, Clock
} from "lucide-react";
import { GeoLocation, WeatherData, TemperatureZone } from "./types";
import { searchLocations, fetchWeather, getWeatherDescription, getWeatherIcon, formatHour, getTemperatureZone } from "./weather";
import DayCard from "./components/DayCard";
import TempBar from "./components/TempBar";

function WeatherIcon({ name, size = 20 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  switch (name) {
    case "cloud-rain": return <CloudRain {...props} />;
    case "snowflake": return <CloudSnow {...props} />;
    case "cloud-lightning": return <CloudLightning {...props} />;
    case "cloud-drizzle": return <CloudRain {...props} />;
    case "cloud-fog": return <Cloud {...props} />;
    case "cloud": return <Cloud {...props} />;
    default: return <Sun {...props} />;
  }
}

const ZONE_STYLES: Record<TemperatureZone, {
  bg: string; gradient: string; badge: string; label: string; labelColor: string; glow: string;
}> = {
  hot: {
    bg: "bg-orange-500",
    gradient: "from-orange-600 via-orange-500 to-amber-400",
    badge: "bg-orange-900/40 border-orange-400/40 text-orange-200",
    label: "Extreme Heat",
    labelColor: "text-orange-100",
    glow: "shadow-orange-500/30",
  },
  mild: {
    bg: "bg-pink-500",
    gradient: "from-pink-600 via-pink-500 to-rose-400",
    badge: "bg-pink-900/40 border-pink-400/40 text-pink-200",
    label: "Warm",
    labelColor: "text-pink-100",
    glow: "shadow-pink-500/30",
  },
  cool: {
    bg: "bg-blue-600",
    gradient: "from-blue-700 via-blue-600 to-sky-400",
    badge: "bg-blue-900/40 border-blue-400/40 text-blue-200",
    label: "Cool",
    labelColor: "text-blue-100",
    glow: "shadow-blue-500/30",
  },
};

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const temperature = weather?.current_weather.temperature ?? null;
  const zone: TemperatureZone = temperature !== null ? getTemperatureZone(temperature) : "cool";
  const style = ZONE_STYLES[zone];

  const loadWeather = useCallback(async (loc: GeoLocation, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude);
      setWeather(data);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load weather data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectLocation(loc: GeoLocation) {
    setSelectedLocation(loc);
    setQuery(loc.name);
    setShowSuggestions(false);
    setSuggestions([]);
    loadWeather(loc);
  }

  const now = new Date();
  const currentHourIndex = weather
    ? weather.hourly.time.findIndex((t) => {
        const h = new Date(t);
        return h.getHours() === now.getHours() && h.toDateString() === now.toDateString();
      })
    : -1;

  const next12Hours = weather && currentHourIndex >= 0
    ? weather.hourly.time
        .slice(currentHourIndex, currentHourIndex + 13)
        .map((t, i) => ({
          time: t,
          temp: weather.hourly.temperature_2m[currentHourIndex + i],
          code: weather.hourly.weathercode[currentHourIndex + i],
        }))
    : [];

  const hourlyTemps = next12Hours.map((h) => h.temp);
  const maxHourly = Math.max(...(hourlyTemps.length ? hourlyTemps : [40]));
  const minHourly = Math.min(...(hourlyTemps.length ? hourlyTemps : [20]));

  const dailyMax = weather ? Math.max(...weather.daily.temperature_2m_max) : 40;
  const dailyMin = weather ? Math.min(...weather.daily.temperature_2m_min) : 20;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${style.gradient} transition-all duration-1000`}>
      {/* Animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full ${style.bg} opacity-20 blur-3xl animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full ${style.bg} opacity-15 blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full ${style.bg} opacity-10 blur-3xl`} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <Thermometer size={28} className="text-white" strokeWidth={1.8} />
            <h1 className="text-3xl font-bold text-white tracking-tight">ThermoWatch</h1>
          </div>
          <p className="text-white/60 text-sm">Real-time temperature monitoring & prediction</p>
        </header>

        {/* Search */}
        <div className="px-4 pb-6 flex justify-center">
          <div ref={searchRef} className="relative w-full max-w-lg">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search city or location..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all text-sm"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50">
                {suggestions.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => selectLocation(loc)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/10 last:border-0"
                  >
                    <MapPin size={14} className="text-white/50 shrink-0" />
                    <div>
                      <span className="text-white text-sm font-medium">{loc.name}</span>
                      {loc.admin1 && <span className="text-white/50 text-xs ml-2">{loc.admin1},</span>}
                      <span className="text-white/50 text-xs ml-1">{loc.country}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">
          {!selectedLocation && !loading && (
            <div className="text-center py-16">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-10 max-w-md mx-auto">
                <MapPin size={40} className="text-white/40 mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-white text-xl font-semibold mb-2">Find your location</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Search for any city in the world to see real-time temperature data and a 7-day forecast with color alerts.
                </p>
                <div className="mt-6 flex flex-col gap-2 text-xs text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span>Below 30°C — Cool</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <span>30°C – 40°C — Warm</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400" />
                    <span>Above 35°C — Extreme Heat</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <p className="text-white/70 text-sm">Fetching weather data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 rounded-2xl p-4 mb-6 max-w-lg mx-auto">
              <AlertTriangle size={18} className="text-red-300 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {weather && selectedLocation && !loading && (
            <div className="space-y-5">
              {/* Current weather card */}
              <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl ${style.glow}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-white/60" />
                      <span className="text-white/80 text-sm font-medium">
                        {selectedLocation.name}
                        {selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}
                      </span>
                    </div>
                    <span className="text-white/50 text-xs">{selectedLocation.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                    <button
                      onClick={() => loadWeather(selectedLocation, true)}
                      disabled={refreshing}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all"
                      title="Refresh"
                    >
                      <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-6">
                  <div>
                    <div className="flex items-start">
                      <span className="text-8xl font-thin text-white leading-none">
                        {Math.round(temperature!)}
                      </span>
                      <span className="text-3xl text-white/70 mt-3">°C</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 flex items-center gap-2">
                      <WeatherIcon name={getWeatherIcon(weather.current_weather.weathercode)} size={14} />
                      {getWeatherDescription(weather.current_weather.weathercode)}
                    </p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3 mb-1">
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp size={12} className="text-white/50" />
                        <span className="text-white/50 text-xs">Today High</span>
                      </div>
                      <span className="text-white font-semibold">{Math.round(weather.daily.temperature_2m_max[0])}°C</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown size={12} className="text-white/50" />
                        <span className="text-white/50 text-xs">Today Low</span>
                      </div>
                      <span className="text-white font-semibold">{Math.round(weather.daily.temperature_2m_min[0])}°C</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wind size={12} className="text-white/50" />
                        <span className="text-white/50 text-xs">Wind</span>
                      </div>
                      <span className="text-white font-semibold">{weather.current_weather.windspeed} km/h</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Droplets size={12} className="text-white/50" />
                        <span className="text-white/50 text-xs">Precip.</span>
                      </div>
                      <span className="text-white font-semibold">{weather.daily.precipitation_sum[0].toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>

                {lastUpdated && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
                    <Clock size={11} className="text-white/30" />
                    <span className="text-white/30 text-xs">
                      Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Heat alert banner */}
              {zone === "hot" && (
                <div className="flex items-center gap-3 bg-orange-500/25 border border-orange-400/40 rounded-2xl p-4 animate-pulse">
                  <AlertTriangle size={20} className="text-orange-300 shrink-0" />
                  <div>
                    <p className="text-orange-200 font-semibold text-sm">Extreme Heat Warning</p>
                    <p className="text-orange-300/70 text-xs mt-0.5">Temperature exceeds 35°C. Stay hydrated and avoid direct sun exposure.</p>
                  </div>
                </div>
              )}

              {/* Hourly forecast */}
              {next12Hours.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-white/60" />
                    <h3 className="text-white font-semibold text-sm">12-Hour Forecast</h3>
                  </div>
                  <div className="space-y-2.5">
                    {next12Hours.map((h, i) => (
                      <TempBar
                        key={h.time}
                        temp={h.temp}
                        label={i === 0 ? "Now" : formatHour(h.time)}
                        maxTemp={maxHourly}
                        minTemp={minHourly}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Temperature chart visual */}
              {next12Hours.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-white/60" />
                    <h3 className="text-white font-semibold text-sm">Temperature Trend</h3>
                  </div>
                  <div className="relative h-28">
                    <svg viewBox={`0 0 ${next12Hours.length * 60} 100`} className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Area fill */}
                      <path
                        d={[
                          `M 0 100`,
                          ...next12Hours.map((h, i) => {
                            const x = i * 60 + 30;
                            const range = maxHourly - minHourly || 1;
                            const y = 95 - ((h.temp - minHourly) / range) * 85;
                            return `L ${x} ${y}`;
                          }),
                          `L ${(next12Hours.length - 1) * 60 + 30} 100`,
                          "Z",
                        ].join(" ")}
                        fill="url(#tempGrad)"
                      />
                      {/* Line */}
                      <polyline
                        points={next12Hours.map((h, i) => {
                          const x = i * 60 + 30;
                          const range = maxHourly - minHourly || 1;
                          const y = 95 - ((h.temp - minHourly) / range) * 85;
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.7"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* Dots */}
                      {next12Hours.map((h, i) => {
                        const x = i * 60 + 30;
                        const range = maxHourly - minHourly || 1;
                        const y = 95 - ((h.temp - minHourly) / range) * 85;
                        const dotZone = getTemperatureZone(h.temp);
                        const dotColor = dotZone === "hot" ? "#fb923c" : dotZone === "mild" ? "#f472b6" : "#60a5fa";
                        return (
                          <circle key={h.time} cx={x} cy={y} r="4" fill={dotColor} stroke="white" strokeWidth="1.5" />
                        );
                      })}
                    </svg>
                    {/* X axis labels */}
                    <div className="flex justify-between mt-1 px-1">
                      {next12Hours.filter((_, i) => i % 3 === 0).map((h, i) => (
                        <span key={i} className="text-[10px] text-white/40">
                          {i === 0 ? "Now" : formatHour(h.time)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7-day forecast */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sun size={16} className="text-white/60" strokeWidth={1.8} />
                  <h3 className="text-white font-semibold text-sm">7-Day Forecast</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {weather.daily.time.map((date, i) => (
                    <DayCard
                      key={date}
                      date={date}
                      maxTemp={weather.daily.temperature_2m_max[i]}
                      minTemp={weather.daily.temperature_2m_min[i]}
                      weathercode={weather.daily.weathercode[i]}
                      precipitation={weather.daily.precipitation_sum[i]}
                    />
                  ))}
                </div>
              </div>

              {/* Temperature prediction insight */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={16} className="text-white/60" />
                  <h3 className="text-white font-semibold text-sm">Prediction Insights</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-white/50 text-xs mb-2">Week Peak Temperature</p>
                    <p className="text-white text-2xl font-bold">{Math.round(dailyMax)}°C</p>
                    <p className="text-white/40 text-xs mt-1">
                      {getTemperatureZone(dailyMax) === "hot" ? "Extreme heat expected" :
                       getTemperatureZone(dailyMax) === "mild" ? "Warm conditions ahead" :
                       "Comfortable temperatures"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-white/50 text-xs mb-2">Week Low Temperature</p>
                    <p className="text-white text-2xl font-bold">{Math.round(dailyMin)}°C</p>
                    <p className="text-white/40 text-xs mt-1">
                      {dailyMin < 10 ? "Very cold nights ahead" :
                       dailyMin < 20 ? "Cool evenings expected" :
                       "Warm throughout the week"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-white/50 text-xs mb-2">Avg Daily Max</p>
                    <p className="text-white text-2xl font-bold">
                      {Math.round(weather.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / weather.daily.temperature_2m_max.length)}°C
                    </p>
                    <p className="text-white/40 text-xs mt-1">Over the next 7 days</p>
                  </div>
                </div>
              </div>

              {/* Zone color legend */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { zone: "cool" as TemperatureZone, color: "bg-blue-500", label: "Below 30°C", desc: "Cool / Cold" },
                  { zone: "mild" as TemperatureZone, color: "bg-pink-500", label: "30°C – 35°C", desc: "Warm / Mild" },
                  { zone: "hot" as TemperatureZone, color: "bg-orange-500", label: "Above 35°C", desc: "Extreme Heat" },
                ].map((item) => (
                  <div
                    key={item.zone}
                    className={`rounded-2xl p-3 border ${zone === item.zone ? "border-white/40 bg-white/20 scale-105" : "border-white/10 bg-white/5"} transition-all`}
                  >
                    <div className={`w-3 h-3 rounded-full ${item.color} mb-2`} />
                    <p className="text-white text-xs font-semibold">{item.desc}</p>
                    <p className="text-white/50 text-[10px]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
