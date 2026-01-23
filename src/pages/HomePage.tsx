import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
        Welcome to QuizApp
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Test your knowledge, challenge yourself, and track your progress with our advanced quiz platform.
      </p>

      <div className="flex gap-4">
        {user ? (
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Login</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
