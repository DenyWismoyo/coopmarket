// File: src/hooks/use-auth.ts
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { UserProfile } from "@/types";
import { User as FirebaseUser } from "firebase/auth";

export function useAuthHook() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch data profil tambahan dari Firestore
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUserData(profile);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}