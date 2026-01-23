import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newUsername = register(name, role);
    if (newUsername) {
        setGeneratedUsername(newUsername);
    } else {
      alert("Registration failed.");
    }
  };

  const handleCloseDialog = () => {
      setGeneratedUsername(null);
      navigate("/login");
  };

  const copyToClipboard = () => {
      if (generatedUsername) {
          navigator.clipboard.writeText(generatedUsername);
          alert("Copied to clipboard!");
      }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your display name. We will generate a unique login ID for you.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup defaultValue="user" onValueChange={(val) => setRole(val as "user" | "admin")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="r-user" />
                  <Label htmlFor="r-user">User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="r-admin" />
                  <Label htmlFor="r-admin">Admin</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full">Sign Up</Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="underline">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={!!generatedUsername} onOpenChange={handleCloseDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registration Successful!</DialogTitle>
                <DialogDescription>
                    Your unique Login ID has been generated. You MUST use this ID to login.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
                <span className="font-mono text-xl font-bold flex-1 text-center">{generatedUsername}</span>
                <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <DialogFooter>
                <Button onClick={handleCloseDialog}>Go to Login</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
