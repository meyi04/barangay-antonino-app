import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { getUserProfile, onAuthChange, type UserProfile } from "../services/authService";
import { registerResidentPushNotifications } from "../services/pushNotificationService";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  enablePushNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeUid = useRef<string | null>(null);
  const stopPushRegistration = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setLoading(true);
      setProfile(null);
      setUser(currentUser);
      activeUid.current = currentUser?.uid ?? null;

      if (currentUser) {
        try {
          setProfile(await getUserProfile(currentUser.uid));
        } catch (error) {
          console.error("Unable to load the user profile", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || profile?.role !== "resident") return;

    const browserNotificationsAllowed =
      typeof Notification !== "undefined" && Notification.permission === "granted";
    if (!Capacitor.isNativePlatform() && !browserNotificationsAllowed) return;

    let active = true;
    let stopRegistration: (() => Promise<void>) | undefined;

    void registerResidentPushNotifications(user.uid)
      .then((stop) => {
        if (active) {
          stopRegistration = stop;
          stopPushRegistration.current = stop;
        } else {
          void stop();
        }
      })
      .catch((error) => console.warn("Push notification registration failed", error));

    return () => {
      active = false;
      if (stopRegistration) {
        if (stopPushRegistration.current === stopRegistration) {
          stopPushRegistration.current = null;
        }
        void stopRegistration();
      }
    };
  }, [profile?.role, user?.uid]);

  const enablePushNotifications = async () => {
    if (!user || profile?.role !== "resident") {
      throw new Error("Sign in to enable request notifications.");
    }

    await stopPushRegistration.current?.();
    stopPushRegistration.current = null;

    const uid = user.uid;
    const stop = await registerResidentPushNotifications(uid, true);
    if (activeUid.current !== uid) {
      await stop();
      throw new Error("Your session changed before notifications could be enabled.");
    }
    stopPushRegistration.current = stop;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, enablePushNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
