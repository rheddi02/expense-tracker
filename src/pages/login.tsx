import { useEffect, useState } from "react";
import Login from "@/components/Auth/login";
import ForgotPassword from "@/components/Auth/forgot-password";
import ResetPassword from "@/components/Auth/reset-password";
import Register from "@/components/Auth/register";
import {
  signUpWithEmail,
  signInWithEmail,
  forgotPassword,
  updatePassword,
  signOut,
} from "@/auth/authService";
import { getProfile } from "@/utils/profile-helper";
import { getAppSettings } from "@/utils/adminQueries";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [view, setView] = useState<"login" | "forgot" | "reset" | "register">("login");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const appSettings = await getAppSettings();
        if (appSettings) {
          setMaintenanceMode(appSettings.maintenanceMode);
          setRegistrationEnabled(appSettings.registrationEnabled);
        }
      } catch (error) {
        console.error("Unable to load app settings:", error);
      }
    };

    loadAppSettings();
  }, []);

  const handleLogin = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
  
    // Check maintenance mode AFTER login but BEFORE allowing access
    if (maintenanceMode) {
      const profile = await getProfile();

      if (!profile || profile.role !== "admin") {
        await signOut();
        setMessage("Maintenance mode is enabled. Only admins can log in.");
        return;
      }
    }

      const loginResponse = await signInWithEmail(email, password);

    if (!loginResponse) {
      throw new Error("Invalid login response");
    }

    setMessage("Logged in successfully");
  } catch (error: any) {
    setMessage(error?.message ?? "Login failed");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleRegister = async () => {
    if (!registrationEnabled) {
      setMessage("New registrations are currently disabled.");
      return;
    }

    if (isSubmitting) return;
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      setMessage("Registration successful. Check your email for confirmation.");
      setView("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage(error?.message ?? "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setMessage("Check your email for reset link");
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setMessage("Password updated successfully");
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setMessage("");
  }, [view]);

  if (view === "login") {
    return (
      <Login
        handleLogin={handleLogin}
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        message={message}
        setView={setView}
        isLoading={isSubmitting}
        maintenanceMode={maintenanceMode}
        registrationEnabled={registrationEnabled}
      />
    );
  }

  if (view === "forgot") {
    return (
      <ForgotPassword
        handleForgot={handleForgot}
        email={email}
        setEmail={setEmail}
        setView={setView}
        message={message}
        isLoading={isSubmitting}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        handleRegister={handleRegister}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        message={message}
        setView={setView}
        isLoading={isSubmitting}
        registrationEnabled={registrationEnabled}
      />
    );
  }

  return (
    <ResetPassword
      {...{ handleReset, password, setPassword, message, setView, isLoading: isSubmitting }}
    />
  );
}
