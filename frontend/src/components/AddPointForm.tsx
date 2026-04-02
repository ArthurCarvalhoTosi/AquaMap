import { useState, useRef, useEffect } from "react";
import { X, MapPin, Camera, Loader2, MapPinned } from "lucide-react";
import api from "../services/api";

/** Aceita " -22,9 " ou "-22.9" (pt-BR ou en) */
function parseCoordinateInput(raw: string): number {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  return parseFloat(s);
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

interface Props {
  userPosition: [number, number] | null;
  /** Se veio do clique no mapa, pré-preenche modo manual com essas coords */
  initialCoordinates?: [number, number] | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPointForm({
  userPosition,
  initialCoordinates = null,
  onClose,
  onCreated,
}: Props) {
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCoordinates) {
      const [la, ln] = initialCoordinates;
      setManualLat(la.toFixed(8));
      setManualLng(ln.toFixed(8));
      setUseCurrentLocation(false);
    } else {
      setManualLat("");
      setManualLng("");
      setUseCurrentLocation(true);
    }
  }, [initialCoordinates]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let lat: number, lng: number;

    if (useCurrentLocation) {
      if (!userPosition) {
        setError(
          "Localização não disponível. Use coordenadas manuais, clique no mapa ou ative o GPS."
        );
        return;
      }
      [lat, lng] = userPosition;
    } else {
      lat = parseCoordinateInput(manualLat);
      lng = parseCoordinateInput(manualLng);
      if (!isValidLatLng(lat, lng)) {
        setError(
          "Coordenadas inválidas. Use latitude entre -90 e 90 e longitude entre -180 e 180 (vírgula ou ponto decimal)."
        );
        return;
      }
    }

    setLoading(true);

    const formData = new FormData();
    // Formato invariante (ponto decimal) para o servidor
    formData.append("latitude", lat.toLocaleString("en-US", { maximumFractionDigits: 14, useGrouping: false }));
    formData.append("longitude", lng.toLocaleString("en-US", { maximumFractionDigits: 14, useGrouping: false }));
    formData.append("description", description);
    formData.append("address", address);
    if (photo) formData.append("photo", photo);

    try {
      await api.post("/waterpoints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao cadastrar ponto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Adicionar Ponto de Água
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do ponto *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Torneira ao lado do banco da praça central"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base resize-none focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              rows={3}
              required
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço aproximado
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Praça da Sé, Centro - SP"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setUseCurrentLocation(true)}
                className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-medium transition-colors ${useCurrentLocation
                  ? "bg-sky-100 text-sky-700 border-2 border-sky-300"
                  : "bg-gray-50 text-gray-600 border-2 border-transparent"
                  }`}
              >
                <MapPin size={14} className="inline mr-1" />
                Minha localização
              </button>
              <button
                type="button"
                onClick={() => setUseCurrentLocation(false)}
                className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-medium transition-colors ${!useCurrentLocation
                  ? "bg-sky-100 text-sky-700 border-2 border-sky-300"
                  : "bg-gray-50 text-gray-600 border-2 border-transparent"
                  }`}
              >
                <MapPinned size={14} className="inline mr-1" />
                Manual / mapa
              </button>
            </div>
            {initialCoordinates && (
              <p className="text-xs text-sky-600 mb-2">
                Coordenadas definidas pelo clique no mapa — você pode ajustar nos
                campos abaixo.
              </p>
            )}
            {useCurrentLocation ? (
              <p className="text-sm text-gray-500">
                {userPosition
                  ? `📍 ${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}`
                  : "⏳ Obtendo localização..."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Latitude"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
                <input
                  type="text"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="Longitude"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto do local
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
              >
                <Camera size={20} />
                Tirar foto ou escolher do celular
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? "Cadastrando..." : "Cadastrar Ponto de Água"}
          </button>
        </form>
      </div>
    </div>
  );
}
