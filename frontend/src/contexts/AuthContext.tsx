import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("aquamap_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const { data } = await api.post("/auth/login", {
      phoneNumber: phone,
      password,
    });
    const userData: User = {
      token: data.token,
      userName: data.userName,
      userId: data.userId,
    };
    localStorage.setItem("aquamap_user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name: string, phone: string, password: string) => {
    const { data } = await api.post("/auth/register", {
      name,
      phoneNumber: phone,
      password,
    });
    const userData: User = {
      token: data.token,
      userName: data.userName,
      userId: data.userId,
    };
    localStorage.setItem("aquamap_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("aquamap_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
