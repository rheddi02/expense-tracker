import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleLoginButton from "@/auth/authService";
import { LoginSeparator } from "@/components/Separator";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>
            {view === "login"
              ? "Login"
              : view === "forgot"
              ? "Forgot Password"
              : "Reset Password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {view !== "forgot" && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {view === "login" && (
            <>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
              <LoginSeparator />
              <GoogleLoginButton />
              <Button
                variant="link"
                onClick={() => setView("forgot")}
                className="w-full"
              >
                Forgot Password?
              </Button>
            </>
          )}

          {view === "forgot" && (
            <>
              <Button onClick={handleForgot} className="w-full">
                Send Reset Link
              </Button>
              <Button
                variant="link"
                onClick={() => setView("login")}
                className="w-full"
              >
                Back to Login
              </Button>
            </>
          )}

          {view === "reset" && (
            <Button onClick={handleReset} className="w-full">
              Update Password
            </Button>
          )}

          {message && (
            <p className="text-sm text-center text-muted-foreground">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
