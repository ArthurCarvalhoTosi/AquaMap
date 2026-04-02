import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  User,
  LogOut,
  RefreshCw,
  Droplets,
  MapPin,
} from "lucide-react";
import WaterMap from "../components/WaterMap";
import BottomSheet from "../components/BottomSheet";
import AddPointForm from "../components/AddPointForm";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import type { WaterPoint } from "../types";

export default function MapPage() {
  const { user, logout } = useAuth();
  const [points, setPoints] = useState<WaterPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<WaterPoint | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  /** Coordenadas vindas do clique no mapa (null = abriu pelo botão) */
  const [coordsFromMapClick, setCoordsFromMapClick] = useState<
    [number, number] | null
  >(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    try {
      const { data } = await api.get("/waterpoints");
      setPoints(data);
    } catch (err) {
      console.error("Erro ao buscar pontos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const returnToMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => console.log("Geolocalização negada"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        () => console.log("Geolocalização negada"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleAddPoint = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setCoordsFromMapClick(null);
    setShowAddForm(true);
  };

  const handleMapClickForAdd = (lat: number, lng: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setCoordsFromMapClick([lat, lng]);
    setShowAddForm(true);
  };

  const handlePointCreated = () => {
    setShowAddForm(false);
    fetchPoints();
  };

  const handlePointUpdated = () => {
    fetchPoints();
    setSelectedPoint(null);
  };

  return (
    <div className="h-full w-full relative">
      <WaterMap
        points={points}
        onSelectPoint={setSelectedPoint}
        userPosition={userPosition}
        onMapClick={user ? handleMapClickForAdd : undefined}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
            <Droplets size={22} className="text-sky-500" />
            <span className="font-bold text-gray-800 text-lg">AquaMap</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={returnToMyLocation}
              className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-colors cursor-pointer"
              title="Voltar a localização atual"
              aria-label="Voltar a localização atual"
            >
              <MapPin size={20} className="text-gray-600" />
            </button>
            <button
              type="button"
              onClick={fetchPoints}
              className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-colors cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw
                size={20}
                className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-colors"
              >
                <User size={20} className="text-gray-600" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-gray-800">
                            {user.userName}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                        >
                          Entrar
                        </Link>
                        <Link
                          to="/cadastro"
                          className="block px-4 py-2.5 text-sky-600 font-medium hover:bg-sky-50"
                        >
                          Criar Conta
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-4 z-10 pointer-events-auto max-w-[200px]">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-3 py-2 space-y-1">
          {user && (
            <p className="text-[11px] text-sky-700 leading-snug pb-1 border-b border-gray-100">
              Logado: toque em um ponto vazio do mapa para cadastrar aí.
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Disponível
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Aguardando
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Sem Água
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="absolute bottom-6 right-4 z-10 pointer-events-auto">
        <button
          onClick={handleAddPoint}
          className="flex items-center gap-2 px-5 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-2xl shadow-xl text-base transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={22} strokeWidth={2.5} />
          Adicionar Ponto
        </button>
      </div>

      {/* Bottom Sheet */}
      {selectedPoint && (
        <BottomSheet
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onUpdated={handlePointUpdated}
        />
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AddPointForm
          userPosition={userPosition}
          initialCoordinates={coordsFromMapClick}
          onClose={() => {
            setCoordsFromMapClick(null);
            setShowAddForm(false);
          }}
          onCreated={handlePointCreated}
        />
      )}
    </div>
  );
}
