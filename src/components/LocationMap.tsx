import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  createdAt: string;
}

export const LocationMap = ({ latitude, longitude, createdAt }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([latitude, longitude], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map.current);
    
    // Add popup
    marker.bindPopup(`
      <div style="font-size: 12px;">
        <p style="font-weight: 600; margin-bottom: 4px;">Lokasi Container</p>
        <p>Lat: ${latitude.toFixed(6)}</p>
        <p>Lng: ${longitude.toFixed(6)}</p>
        <p style="color: #666; margin-top: 4px;">
          ${new Date(createdAt).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    `);

    setIsLoaded(true);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, createdAt]);

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainer} 
        className="h-[200px] w-full rounded-lg overflow-hidden border"
        style={{ minHeight: '200px' }}
      />
      {isLoaded && (
        <div className="text-xs text-muted-foreground">
          <p>📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};
