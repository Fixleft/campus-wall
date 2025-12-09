// src/data/UserContext.tsx
import { createContext, useContext, useState, useEffect} from "react";
import type { ReactNode } from "react";
import api from "@/utils/api";
import { resetLoginDialogState } from "@/utils/api";

interface User {
  uid: string;
  name: string;
  avatar: string;
  signature?: string;
  hometown?: string;
  age?: number;
  gender?: string;
  enable: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refresh: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/users/info");  
      setUser(res.data);                            
    } catch (err) {
      console.log("获取用户信息失败", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 关键！监听 token 变化 + 手动 refresh 都能触发
  useEffect(() => {
    fetchUser();

    const handleStorage = () => {
      fetchUser();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refresh = () => fetchUser();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    resetLoginDialogState();
  };

  return (
    <UserContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser 必须在 UserProvider 内使用");
  }
  return context;
};