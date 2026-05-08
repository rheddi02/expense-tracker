import { supabase } from "../lib/supabase";
import { clearDB } from "../utils/db";
import { Button } from "@/components/ui/button";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

/**
 * Sign in with Google OAuth
 */
// export async function signInWithGoogle() {
//   try {
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${window.location.origin}/expense-tracker/auth/callback`,
//       },
//     });
//     if (error) throw error;
//     return data;
//   } catch (error) {
//     console.error("Google sign-in error:", error);
//     throw error;
//   }
// }
export default function GoogleLoginButton() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/expense-tracker/auth/callback`,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <Button onClick={handleLogin} className="w-full">
      Google
    </Button>
  );
}
/**
 * Sign in with email + password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
}

/**
 * Sign up with email + password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
}

/**
 * Trigger forgot password email
 */
export async function forgotPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/expense-tracker/reset-password`,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Forgot password error:", error);
    throw error;
  }
}

/**
 * Update password (for reset flow)
 */
export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Update password error:", error);
    throw error;
  }
}

/**
 * Sign out, clear current user's local data
 */
export async function signOut() {
  try {
    // Get current user before signing out
    const { data: userData } = await supabase.auth.getUser();
    
    // Clear only current user's local data before signing out
    if (userData.user) {
      await clearDB(userData.user.id);
    }

    // Clear cached user data
    localStorage.removeItem('cached_user');
    localStorage.removeItem('cached_profile');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

/**
 * Get current authenticated session user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      };
    }
    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Listen for auth state changes (login/logout)
 * Returns unsubscribe function
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
      };
      localStorage.setItem("cached_user", JSON.stringify(user));
      callback(user);
    } else {
      localStorage.removeItem("cached_user");
      callback(null);
    }
  });

  return data?.subscription?.unsubscribe;
}

/**
 * Get current session (for passing user_id to transactions)
 */
export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}
