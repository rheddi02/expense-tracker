import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleLoginButton from "@/auth/authService";
import { LoginSeparator } from "@/components/Separator";
import Login from "@/components/Auth/login";
import ForgotPassword from "@/components/Auth/forgot-password";
import ResetPassword from "@/components/Auth/reset-password";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("login"); // login | forgot | reset
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMessage(error ? error.message : "Logged in successfully");
  };

  const handleForgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset",
    });
    setMessage(error ? error.message : "Check your email for reset link");
  };

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    setMessage(error ? error.message : "Password updated successfully");
  };

  useEffect( () => {
    setMessage("");
  },[view])

  return view === "login" ? (
    <Login {...{ handleLogin, email, password, setEmail, setPassword, message, setView }} />
  ) : view == "forgot" ? (
    <ForgotPassword {...{ handleForgot, email, setEmail, setView }} />
  ) : (
    <ResetPassword {...{ handleReset, password, setPassword, setView }} />
  );
}
