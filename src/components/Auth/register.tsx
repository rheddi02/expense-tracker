import { type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "./password-input";

type Props = {
  handleRegister: () => Promise<void>;
  email: string;
  password: string;
  confirmPassword: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  message: string;
  setView: Dispatch<SetStateAction<"login" | "forgot" | "reset" | "register">>;
  isLoading: boolean;
  registrationEnabled?: boolean;
};

export default function Register({
  handleRegister,
  email,
  password,
  confirmPassword,
  setEmail,
  setPassword,
  setConfirmPassword,
  message,
  setView,
  isLoading,
  registrationEnabled = true,
}: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          {!registrationEnabled && (
            <p className="mt-2 text-sm text-red-600">
              Registrations are currently closed. Please check back later.
            </p>
          )}
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
            placeholder="Create a password"
          />
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />

          <Button
            onClick={handleRegister}
            className="w-full"
            disabled={isLoading || !registrationEnabled}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Registering...
              </span>
            ) : (
              "Register"
            )}
          </Button>

          <Button
            variant="link"
            onClick={() => setView("login")}
            className="w-full"
          >
            Back to Login
          </Button>

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
