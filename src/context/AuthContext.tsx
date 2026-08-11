import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

type User = {
  username: string;
  roleId: number;
  teamId: string | null;
};

type AuthContextType = {
  accessToken: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );

  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return null;
    }

    try {
      return jwtDecode<User>(token);
    } catch {
      return null;
    }
  });

  const login = (token: string) => {
    localStorage.setItem("accessToken", token);

    const decodedUser = jwtDecode<User>(token);

    setAccessToken(token);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};