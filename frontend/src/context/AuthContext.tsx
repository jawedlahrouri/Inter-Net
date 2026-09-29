import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  type User,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResponse,
  loginUser,
  registerUser,
  fetchCurrentUser,
  getStoredToken,
  clearStoredToken,
} from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  showMotivationalTransition: boolean;
  setShowMotivationalTransition: (show: boolean) => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMotivationalTransition, setShowMotivationalTransition] = useState<boolean>(false);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Session expirée ou invalide:', err);
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleLogin = async (payload: LoginPayload) => {
    const data = await loginUser(payload);
    setUser(data.user);
    setShowMotivationalTransition(true);
  };

  const handleRegister = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    return await registerUser(payload);
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setShowMotivationalTransition(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        showMotivationalTransition,
        setShowMotivationalTransition,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
}
