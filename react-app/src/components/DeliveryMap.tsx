import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryMap.css';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface DeliveryMapProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  roomNumber?: string;
}

// UMBC campus center
const UMBC_CENTER: [number, number] = [39.2537, -76.7143];

export default function DeliveryMap({ pickupLocation, deliveryLocation, roomNumber }: DeliveryMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate center between pickup and delivery
  const centerLat = (pickupLocation.latitude + deliveryLocation.latitude) / 2;
  const centerLng = (pickupLocation.longitude + deliveryLocation.longitude) / 2;
  const mapCenter: [number, number] = [centerLat, centerLng];

  return (
    <div className={`delivery-map-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="map-header">
        <h4 className="map-title">Delivery Route</h4>
        <button
          className="map-toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-marker pickup"></span>
          <span>Pickup: {pickupLocation.name}</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker delivery"></span>
          <span>Delivery: {deliveryLocation.name}{roomNumber ? ` - Room ${roomNumber}` : ''}</span>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={16}
          scrollWheelZoom={false}
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pickup marker (blue) */}
          <Marker
            position={[pickupLocation.latitude, pickupLocation.longitude]}
            icon={pickupIcon}
          >
            <Popup>
              <strong>Pickup Location</strong><br />
              {pickupLocation.name}
            </Popup>
          </Marker>

          {/* Delivery marker (green) */}
          <Marker
            position={[deliveryLocation.latitude, deliveryLocation.longitude]}
            icon={deliveryIcon}
          >
            <Popup>
              <strong>Delivery Location</strong><br />
              {deliveryLocation.name}
              {roomNumber && <><br />Room {roomNumber}</>}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

// Default coordinates for locations without coordinates
export const DEFAULT_COORDINATES = {
  UMBC_CENTER,
  COMMONS: { latitude: 39.2555, longitude: -76.7115 },
  UNIVERSITY_CENTER: { latitude: 39.2540, longitude: -76.7140 },
  TRUE_GRITS: { latitude: 39.2560, longitude: -76.7180 },
  LIBRARY: { latitude: 39.2535, longitude: -76.7165 },
};
