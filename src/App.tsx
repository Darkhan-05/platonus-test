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

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user } = useAuth();

  if (!user) {
    console.log("No user found, redirecting to register");
    return <Navigate to="/register" replace />;
  }

  if (requireAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const UnauthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
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
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />

                <Route path="/create-quiz" element={
                  <ProtectedRoute>
                    <CreateQuizPage />
                  </ProtectedRoute>
                } />

                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/setup" element={
                  <ProtectedRoute>
                    <QuizSetupPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/play" element={
                  <ProtectedRoute>
                    <QuizSessionPage />
                  </ProtectedRoute>
                } />

                <Route path="/quiz/:quizId/results/:attemptId" element={
                  <ProtectedRoute>
                    <ResultsPage />
                  </ProtectedRoute>
                } />

                <Route index path="/register/:token" element={
                  <UnauthenticatedRoute>
                    <RegisterPage />
                  </UnauthenticatedRoute>} />
              </Route>

              <Route path="/secret-room/admin" element={
                <AdminPage />
              }>
              </Route>
              <Route path="*" element={<Navigate to="/register/default-token" replace />} />
            </Routes>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
