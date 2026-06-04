import React from "react";
import { getTemperatureZone } from "../weather";

interface TempBarProps {
  temp: number;
  label: string;
  maxTemp: number;
  minTemp: number;
}

export default function TempBar({ temp, label, maxTemp, minTemp }: TempBarProps) {
  const zone = getTemperatureZone(temp);
  const range = maxTemp - minTemp || 1;
  const pct = ((temp - minTemp) / range) * 100;

  const barColor =
    zone === "hot" ? "bg-orange-400" :
    zone === "mild" ? "bg-pink-400" :
    "bg-blue-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/70 w-10 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-white w-12 shrink-0">{temp.toFixed(1)}°C</span>
    </div>
  );
}
