export enum WaterPointStatus {
  Disponivel = 1,
  SemAgua = 2,
  Manutencao = 3,
}

export enum InteractionType {
  VotoDeVerificacao = 1,
  RelatoTemAgua = 2,
  RelatoSecou = 3,
}

export interface WaterPoint {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  address: string;
  photoUrl: string | null;
  isVerified: boolean;
  currentStatus: WaterPointStatus;
  createdByUserName: string;
  createdAt: string;
  lastStatusUpdate: string;
  verificationVotes: number;
  recentPositiveReports: number;
  recentNegativeReports: number;
}

export interface AuthResponse {
  token: string;
  userName: string;
  userId: string;
}

export interface User {
  token: string;
  userName: string;
  userId: string;
}
