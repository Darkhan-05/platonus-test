import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/Layout";
import { QuizProvider } from "@/context/QuizContext";

// Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CreateQuizPage from "@/pages/CreateQuizPage";
import QuizSetupPage from "@/pages/QuizSetupPage";
import QuizSessionPage from "@/pages/QuizSessionPage";
import ResultsPage from "@/pages/ResultsPage";
import AdminPage from "@/pages/AdminPage";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }: { childre: React.ReactNode, requireAdmin?: boolean }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
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
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />

                <Route path="/create-quiz" element={
                  <ProtectedRoute requireAdmin>
                    <CreateQuizPage />
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

                 <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
