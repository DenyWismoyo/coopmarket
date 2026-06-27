// File: src/components/auth/auth-provider.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuthHook } from "@/hooks/use-auth";
import { UserProfile } from "@/types";
import { User } from "firebase/auth";
import { useFCM } from "@/hooks/use-fcm"; 

interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isMember: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuthHook();
  
  // PERUBAHAN DI SINI: Masukkan 'user' sebagai argumen
  useFCM(user); 

  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'unit_admin';
  const isMember = userData?.role === 'member';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, isMember }}>
      {children}
    </AuthContext.Provider>
  );
}