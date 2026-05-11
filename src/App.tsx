import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QuizProvider } from "@/context/QuizContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

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

function AppContent() {
  const { isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="relative flex flex-col items-center">
          {/* Pulsing ring */}
          <div className="absolute -inset-4 w-24 h-24 bg-blue-500/20 rounded-full animate-ping blur-xl" />
          <div className="relative w-16 h-16 border-4 border-blue-500/10 border-t-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.3)]" />

          <div className="mt-10 space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-600">
              PLATONUS
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-50 mt-4">
              {t('authChecking')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <LanguageProvider>
        <AuthProvider>
          <QuizProvider>
            <AppContent />
          </QuizProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
