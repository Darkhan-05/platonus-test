import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QuizProvider } from "@/context/QuizContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Pages
import AdminPage from "@/pages/AdminPage";
import CreateQuizPage from "@/pages/CreateQuizPage";
import DashboardPage from "@/pages/DashboardPage";
import QuizSessionPage from "@/pages/QuizSessionPage";
import QuizSetupPage from "@/pages/QuizSetupPage";
import RegisterPage from "@/pages/RegisterPage";
import ResultsPage from "@/pages/ResultsPage";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/register" replace />;
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
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/*" element={<RegisterPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
