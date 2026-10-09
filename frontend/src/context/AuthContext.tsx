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

/**
 * @brief Provides authentication state and login, register and logout actions to its descendants.
 * @param children React nodes rendered inside the authentication context provider.
 * @return An AuthContext provider element exposing the user, loading flag, transition flag and auth actions around the children.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMotivationalTransition, setShowMotivationalTransition] = useState<boolean>(false);

  useEffect(() => {
    /**
     * @brief Restores the session by fetching the current user when a stored token exists, clearing the token if it is invalid.
     */
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

  /**
   * @brief Logs the user in through the API, stores the user and triggers the motivational transition.
   * @param payload The login credentials sent to the API.
   */
  const handleLogin = async (payload: LoginPayload) => {
    const data = await loginUser(payload);
    setUser(data.user);
    setShowMotivationalTransition(true);
  };

  /**
   * @brief Registers a new account through the API and returns the registration response for email activation.
   * @param payload The registration data sent to the API.
   * @return The registration response.
   */
  const handleRegister = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    return await registerUser(payload);
  };

  /**
   * @brief Clears the stored token and resets the user and transition state.
   */
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

/**
 * @brief Returns the authentication context value and throws if used outside an AuthProvider.
 * @return The auth context object with user, loading state, transition flag and login, register and logout functions.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
}
