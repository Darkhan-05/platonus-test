import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username)) {
      navigate("/dashboard");
    } else {
      alert("Login failed. User not found.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your unique Login ID (e.g. User#1234).</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login ID</Label>
              <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="User#1234" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full">Login</Button>
             <p className="text-sm text-center text-muted-foreground">
              Don't have an account? <Link to="/register" className="underline">Sign Up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
