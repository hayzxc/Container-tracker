import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  return (
    <div className="space-y-2">
      <div className="h-[200px] w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Lokasi Container</p>
                <p>Lat: {latitude.toFixed(6)}</p>
                <p>Lng: {longitude.toFixed(6)}</p>
                <p className="text-muted-foreground mt-1">
                  {new Date(createdAt).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
      </div>
    </div>
  );
};
