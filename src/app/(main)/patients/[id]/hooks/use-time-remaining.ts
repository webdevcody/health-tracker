import { useState, useEffect } from "react";
import { addHours, differenceInMinutes } from "date-fns";

export function useTimeRemaining(recordedAt: Date, intervalHours: number) {
  const [timeInfo, setTimeInfo] = useState(() => {
    const nextDoseTime = addHours(new Date(recordedAt), intervalHours);
    const now = new Date();
    const minutesRemaining = differenceInMinutes(nextDoseTime, now);
    const hoursRemaining = Math.floor(Math.abs(minutesRemaining) / 60);
    const minsRemaining = Math.abs(minutesRemaining) % 60;

    return {
      nextDoseTime,
      timeRemaining:
        minutesRemaining > 0
          ? `${hoursRemaining}h ${minsRemaining}m remaining`
          : null,
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextDoseTime = addHours(new Date(recordedAt), intervalHours);
      const now = new Date();
      const minutesRemaining = differenceInMinutes(nextDoseTime, now);
      const hoursRemaining = Math.floor(Math.abs(minutesRemaining) / 60);
      const minsRemaining = Math.abs(minutesRemaining) % 60;

      setTimeInfo({
        nextDoseTime,
        timeRemaining:
          minutesRemaining > 0
            ? `${hoursRemaining}h ${minsRemaining}m remaining`
            : null,
      });
    }, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [recordedAt, intervalHours]);

  return timeInfo;
}
