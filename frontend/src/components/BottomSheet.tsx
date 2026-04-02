import { useState } from "react";
import {
  X,
  Navigation,
  Droplets,
  DropletOff,
  ShieldCheck,
  Clock,
  MapPin,
  ThumbsUp,
  Camera,
} from "lucide-react";
import type { WaterPoint } from "../types";
import { WaterPointStatus, InteractionType } from "../types";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface Props {
  point: WaterPoint;
  onClose: () => void;
  onUpdated: () => void;
}

export default function BottomSheet({ point, onClose, onUpdated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const statusLabel = {
    [WaterPointStatus.Disponivel]: {
      text: "Disponível",
      color: "bg-green-100 text-green-800",
      icon: <Droplets size={16} />,
    },
    [WaterPointStatus.SemAgua]: {
      text: "Sem Água",
      color: "bg-red-100 text-red-800",
      icon: <DropletOff size={16} />,
    },
    [WaterPointStatus.Manutencao]: {
      text: "Em Manutenção",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={16} />,
    },
  };

  const status = statusLabel[point.currentStatus];

  const handleInteraction = async (type: InteractionType) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(type.toString());
    try {
      await api.post(`/waterpoints/${point.id}/interact`, { type });
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao enviar interação.");
    } finally {
      setLoading(null);
    }
  };

  const openRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
    window.open(url, "_blank");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {point.photoUrl && (
            <img
              src={point.photoUrl}
              alt="Foto do ponto"
              className="w-full h-48 object-cover rounded-2xl mt-2"
            />
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
              >
                {status.icon}
                {status.text}
              </span>
              {point.isVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <ShieldCheck size={14} />
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  <Clock size={14} />
                  Aguardando ({point.verificationVotes}/5)
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mt-3">
              {point.description}
            </h2>

            {point.address && (
              <p className="flex items-center gap-1.5 text-gray-500 mt-1">
                <MapPin size={14} />
                {point.address}
              </p>
            )}

            <p className="text-sm text-gray-400 mt-1">
              Adicionado por {point.createdByUserName} ·{" "}
              {timeAgo(point.createdAt)}
            </p>
          </div>

          <button
            onClick={openRoute}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-lg transition-colors"
          >
            <Navigation size={20} />
            Como Chegar
          </button>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">
              Atualize o status deste ponto:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  handleInteraction(InteractionType.RelatoTemAgua)
                }
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
              >
                <Droplets size={20} />
                Tem Água
              </button>
              <button
                onClick={() =>
                  handleInteraction(InteractionType.RelatoSecou)
                }
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
              >
                <DropletOff size={20} />
                Sem Água
              </button>
            </div>

            {!point.isVerified && (
              <button
                onClick={() =>
                  handleInteraction(InteractionType.VotoDeVerificacao)
                }
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <ThumbsUp size={18} />
                Confirmar que este ponto existe ({point.verificationVotes}/5)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
