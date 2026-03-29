import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../services/firebase";

/* ========================= */
/* TYPES */
/* ========================= */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

/* ========================= */
/* CONTEXT */
/* ========================= */
const AuthContext = createContext<AuthContextType | null>(null);

/* ========================= */
/* PROVIDER */
/* ========================= */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ========================= */
  /* LOGOUT */
  /* ========================= */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      throw error;
    }
  };

  /* ========================= */
  /* AUTH LISTENER */
  /* ========================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ========================= */
  /* PROVIDER */
  /* ========================= */
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ========================= */
/* HOOK */
/* ========================= */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  }

  return context;
};