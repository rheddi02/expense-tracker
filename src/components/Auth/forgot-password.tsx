import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  handleForgot: () => Promise<void>;
  message?: string;
  email: string;
  setEmail: (email: string) => void;
  setView: (view: string) => void;
};
export default function ForgotPassword({ handleForgot, message, email, setEmail, setView }: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

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
