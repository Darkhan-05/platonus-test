import { useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function DashboardPage() {
  const { quizzes, deleteQuiz } = useQuiz();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const displayQuizzes = quizzes.filter(q => q.id !== "favorites-quiz");

  const handleConfirmDelete = () => {
    if (quizToDelete) {
      deleteQuiz(quizToDelete);
      setQuizToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{t('availableQuizzes')}</h1>

        <div className="flex flex-wrap gap-3">
          <Link to="/favorites">
            <Button
              variant="secondary"
              disabled={!user || user.favorites.length === 0}
            >
              <Star className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
              {t('favorites')} ({user?.favorites.length || 0})
            </Button>
          </Link>

          <Link to="/create-quiz">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createQuiz')}
            </Button>
          </Link>
        </div>
      </div>

      {displayQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-lg font-medium mb-2">{t('noQuizzes')}</div>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t('startCreating')}
          </p>
          <Link to="/create-quiz">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t('createQuiz')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayQuizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col hover:shadow-md transition-shadow relative group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
                <div className="space-y-1 overflow-hidden">
                  <CardTitle className="line-clamp-1 pr-2">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.questions.length} {t('questionsCount')}</CardDescription>
                </div>

                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      setQuizToDelete(quiz.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4 mt-2">
                  <span>{t('timesSolved')}: {quiz.timesSolved}</span>
                </div>
                <Link to={`/quiz/${quiz.id}/setup`} className="w-full mt-auto">
                  <Button className="w-full">{t('start')}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}