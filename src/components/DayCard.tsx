import React from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from "lucide-react";
import { getWeatherIcon, getWeatherDescription, formatDay } from "../weather";
import { getTemperatureZone } from "../weather";

interface DayCardProps {
  date: string;
  maxTemp: number;
  minTemp: number;
  weathercode: number;
  precipitation: number;
}

function WeatherIcon({ name, size = 18 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  switch (name) {
    case "cloud-rain": return <CloudRain {...props} />;
    case "snowflake": return <CloudSnow {...props} />;
    case "cloud-lightning": return <CloudLightning {...props} />;
    case "cloud-drizzle": return <CloudRain {...props} />;
    case "cloud": return <Cloud {...props} />;
    default: return <Sun {...props} />;
  }
}

export default function DayCard({ date, maxTemp, minTemp, weathercode, precipitation }: DayCardProps) {
  const zone = getTemperatureZone(maxTemp);
  const borderColor =
    zone === "hot" ? "border-orange-300/30" :
    zone === "mild" ? "border-pink-300/30" :
    "border-blue-300/30";

  return (
    <div className={`bg-white/10 backdrop-blur-sm border ${borderColor} rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/15 transition-all duration-300`}>
      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{formatDay(date)}</span>
      <div className="text-white/90 my-1">
        <WeatherIcon name={getWeatherIcon(weathercode)} size={24} />
      </div>
      <span className="text-[10px] text-white/60 text-center leading-tight">{getWeatherDescription(weathercode)}</span>
      <div className="flex gap-2 mt-1">
        <span className="text-sm font-bold text-white">{Math.round(maxTemp)}°</span>
        <span className="text-sm text-white/50">{Math.round(minTemp)}°</span>
      </div>
      {precipitation > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-white/60">
          <Droplets size={10} />
          <span>{precipitation}mm</span>
        </div>
      )}
    </div>
  );
}
