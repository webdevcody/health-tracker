import { format } from "date-fns";

interface TemperatureDisplayProps {
  temperature: number;
  recordedAt: Date;
}

export function TemperatureDisplay({
  temperature,
  recordedAt,
}: TemperatureDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`text-xl font-semibold ${temperature < 100 ? "text-green-500" : ""}`}
      >
        {temperature}°F
      </div>
      <div className="text-muted-foreground">
        @ {format(recordedAt, "h:mm a")}
      </div>
    </div>
  );
}
