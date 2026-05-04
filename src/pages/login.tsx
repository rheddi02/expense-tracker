import { useEffect, useState } from "react";
import Login from "@/components/Auth/login";
import ForgotPassword from "@/components/Auth/forgot-password";
import ResetPassword from "@/components/Auth/reset-password";
import Register from "@/components/Auth/register";
import { signUpWithEmail, signInWithEmail, forgotPassword, updatePassword } from "@/auth/authService";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [view, setView] = useState<"login" | "forgot" | "reset" | "register">("login");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      setMessage("Logged in successfully");
    } catch (error: any) {
      setMessage(error?.message ?? "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
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
        {...{
          handleLogin,
          email,
          password,
          setEmail,
          setPassword,
          message,
          setView,
          isLoading: isSubmitting,
        }}
      />
    );
  }

  if (view === "forgot") {
    return (
      <ForgotPassword
        {...{ handleForgot, email, setEmail, setView, message, isLoading: isSubmitting }}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        {...{
          handleRegister,
          email,
          password,
          confirmPassword,
          setEmail,
          setPassword,
          setConfirmPassword,
          message,
          setView,
          isLoading: isSubmitting,
        }}
      />
    );
  }

  return (
    <ResetPassword
      {...{ handleReset, password, setPassword, message, setView, isLoading: isSubmitting }}
    />
  );
}
