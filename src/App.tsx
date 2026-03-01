import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QuizProvider } from "@/context/QuizContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import CreateQuizPage from "@/pages/CreateQuizPage";
import DashboardPage from "@/pages/DashboardPage";
import QuizSessionPage from "@/pages/QuizSessionPage";
import QuizSetupPage from "@/pages/QuizSetupPage";
import RegisterPage from "@/pages/RegisterPage";
import ResultsPage from "@/pages/ResultsPage";
import FavoritesPage from "./pages/FavoritesPage";
import AdminPage from "./pages/AdminPage";

const ProtectedRoute = ({ children, requireAdmin = false, allowGuest = false }: { children: React.ReactNode, requireAdmin?: boolean, allowGuest?: boolean }) => {
  const { user } = useAuth();

  if (!user && !allowGuest) {
    console.log("No user found, redirecting to register");
    return <Navigate to="/register/default-token" replace />;
  }

  if (requireAdmin) {
    // Current user state doesn't have roles explicitly shown in types, 
    // but we can assume admin check happens here if needed.
    // For now, redirecting out of admin if not admin.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const UnauthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  // We only redirect if we are SURE we are logged in.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <QuizProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={
                  <ProtectedRoute allowGuest={true}>
                    <DashboardPage />
                  </ProtectedRoute>
                } />

                <Route path="/create-quiz" element={
                  <ProtectedRoute allowGuest={true}>
                    <CreateQuizPage />
                  </ProtectedRoute>
                } />

                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/setup" element={
                  <ProtectedRoute allowGuest={true}>
                    <QuizSetupPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/play" element={
                  <ProtectedRoute allowGuest={true}>
                    <QuizSessionPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/results/:attemptId" element={
                  <ProtectedRoute allowGuest={true}>
                    <ResultsPage />
                  </ProtectedRoute>
                } />

                <Route path="/register/:token" element={
                  <UnauthenticatedRoute>
                    <RegisterPage />
                  </UnauthenticatedRoute>} />

                {/* Catch-all for /register without token */}
                <Route path="/register" element={
                  <UnauthenticatedRoute>
                    <RegisterPage />
                  </UnauthenticatedRoute>} />
              </Route>

              <Route path="/secret-room/admin" element={
                <AdminPage />
              }>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
