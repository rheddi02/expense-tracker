import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  handleReset: () => Promise<void>;
  message?: string;
  password: string;
  setPassword: (password: string) => void;
  setView: (view: string) => void;
};

export default function ResetPassword({
  handleReset,
  password,
  setPassword,
  message,
  setView,
}: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleReset} className="w-full">
            Update Password
          </Button>

          <Button
            variant="link"
            onClick={() => setView("login")}
            className="w-full"
          >
            Back to Log
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
