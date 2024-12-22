interface TemperatureDisplayProps {
  temperature: number;
}

export function TemperatureDisplay({ temperature }: TemperatureDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl font-semibold">{temperature}°F</div>
    </div>
  );
}
