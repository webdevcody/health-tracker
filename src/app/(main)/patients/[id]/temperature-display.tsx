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
    <div className="flex flex-col gap-1">
      <div
        className={`text-xl font-semibold ${temperature < 100 ? "text-green-500" : ""}`}
      >
        {temperature}°F
      </div>
      <div className="text-sm text-muted-foreground">
        Recorded at {format(recordedAt, "h:mm a ', ' MMM d, yyyy")}
      </div>
    </div>
  );
}
