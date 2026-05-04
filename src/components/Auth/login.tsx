import { type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleLoginButton from "@/auth/authService";
import { LoginSeparator } from "@/components/Separator";
import { PasswordInput } from "./password-input";

type Props = {
  handleLogin: () => void;
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  message: string;
  setView: Dispatch<SetStateAction<"login" | "forgot" | "register" | "reset">>;
  isLoading: boolean;
};

export default function Login({
  handleLogin,
  email,
  password,
  setEmail,
  setPassword,
  message,
  setView,
  isLoading,
}: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle>Expense Tracker PWA</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="space-y-4 border-l-4 text-left border-red-600">
            {message && (
              <p className="pl-2 text-sm text-muted-foreground">{message}</p>
            )}
          </div>
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </span>
            ) : (
              "Login"
            )}
          </Button>
          <LoginSeparator />
          <GoogleLoginButton />
          <Button
            variant="link"
            onClick={() => setView("register")}
            className="w-full"
          >
            Create an account
          </Button>
          <Button
            variant="link"
            onClick={() => setView("forgot")}
            className="w-full"
          >
            Forgot Password?
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
