import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LiveTimestampProps {
  createdAt: string;
}

export const LiveTimestamp = ({ createdAt }: LiveTimestampProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const createdDate = new Date(createdAt);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeDifference = () => {
    const diff = currentTime.getTime() - createdDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return `${seconds} detik yang lalu`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-sm font-medium">
        <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
        {format(currentTime, "HH:mm:ss", { locale: id })}
      </div>
      <div className="text-xs text-muted-foreground">
        Dibuat: {format(createdDate, "dd MMM yyyy HH:mm", { locale: id })}
      </div>
      <div className="text-xs text-primary font-medium">
        {getTimeDifference()}
      </div>
    </div>
  );
};
