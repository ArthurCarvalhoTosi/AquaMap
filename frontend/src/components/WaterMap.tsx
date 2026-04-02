import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WaterPoint } from "../types";
import { WaterPointStatus } from "../types";

interface Props {
  points: WaterPoint[];
  onSelectPoint: (point: WaterPoint) => void;
  userPosition: [number, number] | null;
  /** Clique no mapa (não nos marcadores) — ex.: abrir cadastro na posição */
  onMapClick?: (lat: number, lng: number) => void;
}

function createMarkerIcon(point: WaterPoint): L.DivIcon {
  let color: string;
  let emoji: string;

  if (point.currentStatus === WaterPointStatus.SemAgua) {
    color = "#ef4444";
    emoji = "🔴";
  } else if (!point.isVerified) {
    color = "#f59e0b";
    emoji = "🟡";
  } else {
    color = "#22c55e";
    emoji = "🟢";
  }

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      font-size:16px;cursor:pointer;
    ">💧</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function FlyToUser({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 14, { duration: 1.5 });
  }, [position, map]);
  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function WaterMap({
  points,
  onSelectPoint,
  userPosition,
  onMapClick,
}: Props) {
  const defaultCenter: [number, number] = [-22.9068, -43.1729]; // Rio de Janeiro

  return (
    <MapContainer
      center={userPosition || defaultCenter}
      zoom={13}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {userPosition && <FlyToUser position={userPosition} />}

      {userPosition && (
        <Marker
          position={userPosition}
          icon={L.divIcon({
            className: "custom-marker",
            html: `<div style="
              width:16px;height:16px;border-radius:50%;
              background:#3b82f6;border:3px solid white;
              box-shadow:0 0 0 4px rgba(59,130,246,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        />
      )}

      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={createMarkerIcon(point)}
          eventHandlers={{ click: () => onSelectPoint(point) }}
        />
      ))}
    </MapContainer>
  );
}
