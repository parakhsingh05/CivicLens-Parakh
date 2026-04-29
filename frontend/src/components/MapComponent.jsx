import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const MapComponent = ({ lat, lng }) => {
  const defaultLat = 13.0827; // Chennai fallback
  const defaultLng = 80.2707;

  return (
    <MapContainer
      center={[lat || defaultLat, lng || defaultLng]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat || defaultLat, lng || defaultLng]}>
        <Popup>Selected Location</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;