import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { getRoleCode, getRoleLabel, type RoleCode } from "../utils/roleUtils";

export interface JwtRawPayload {
  sub: string;
  email?: string;
  username: string;
  firstName?: string;
  lastName?: string | null;
  roleId: number | string;
  roleName?: string;
  role?: { id: number; name: string };
  teamId?: number | null;
  type?: string;
}

export interface User extends JwtRawPayload {
  roleCode: RoleCode;
  roleLabel: string;
}

type AuthContextType = {
  accessToken: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (allowedRoles: RoleCode[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseUserToken = (token: string): User | null => {
  try {
    const raw = jwtDecode<JwtRawPayload>(token);
    const roleName = raw.roleName || raw.role?.name;
    const numRoleId = Number(raw.roleId);
    return {
      ...raw,
      roleId: numRoleId,
      roleCode: getRoleCode(numRoleId, roleName),
      roleLabel: getRoleLabel(numRoleId, roleName),
    };
  } catch {
    return null;
  }
};

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
    if (!token) return null;
    return parseUserToken(token);
  });

  const login = (token: string) => {
    localStorage.setItem("accessToken", token);
    const parsedUser = parseUserToken(token);
    setAccessToken(token);
    setUser(parsedUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const hasRole = (allowedRoles: RoleCode[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.roleCode);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        login,
        logout,
        hasRole,
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