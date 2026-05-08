import { useState, useEffect } from "react";
import { onAuthStateChange, type AuthUser } from "../auth/authService";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("cached_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(readCachedUser);
  const [isAuthReady, setIsAuthReady] = useState(() => readCachedUser() !== null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe?.();
  }, []);

  return { user, isAuthReady };
}
