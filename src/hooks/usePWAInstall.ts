// File: src/hooks/usePWAInstall.ts
import { useState, useEffect } from "react";

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      // Ambil konfigurasi dari env variables Next.js
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
      const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
      const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
      const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
      const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "";

      // Rangkai URL parameter dengan aman
      const params = new URLSearchParams({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId
      });

      const swUrl = `/firebase-messaging-sw.js?${params.toString()}`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => console.log('SW Registered with dynamic config:', registration.scope))
        .catch((err) => console.error('SW Registration failed:', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return { isInstallable: !!installPrompt, triggerInstall };
}