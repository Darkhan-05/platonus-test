import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ArrowLeft, Play, AlertCircle } from "lucide-react";

export default function FavoritesPage() {
  const { user, toggleFavorite } = useAuth();
  const { quizzes, createFavoritesQuiz } = useQuiz();
  const navigate = useNavigate();

  // 1. Находим полные объекты вопросов по ID из избранного
  // Это нужно, так как в user.favorites хранятся только ID строк
  const favoriteQuestions = useMemo(() => {
    if (!user || user.favorites.length === 0) return [];
    
    // 1. ВАЖНО: Исключаем сам "favorites-quiz" из поиска, чтобы не было дублей
    // и исключаем возможные дубликаты вопросов через Set
    const uniqueQuestionsMap = new Map();

    quizzes
      .filter(q => q.id !== "favorites-quiz") // <-- Игнорируем сгенерированный квиз
      .flatMap(q => q.questions)
      .forEach(q => {
        // Если этот вопрос в избранном И мы его еще не добавили в Map
        if (user.favorites.includes(q.id) && !uniqueQuestionsMap.has(q.id)) {
            uniqueQuestionsMap.set(q.id, q);
        }
      });
    
    return Array.from(uniqueQuestionsMap.values());
  }, [user?.favorites, quizzes]);

  const handleStart = () => {
      if (favoriteQuestions.length === 0) return;

      // Создаем временный квиз из текущего списка избранного
      const favQuiz = createFavoritesQuiz(user!.favorites);
      
      if (favQuiz) {
          navigate(`/quiz/${favQuiz.id}/setup`);
      } else {
          alert("Ошибка при создании теста.");
      }
  };

  if (!user || user.favorites.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Список избранного пуст</h2>
              <p className="text-muted-foreground max-w-md">
                  Добавляйте сложные вопросы в избранное во время прохождения тестов, чтобы повторить их здесь.
              </p>
              <Link to="/dashboard">
                  <Button variant="outline">Вернуться назад</Button>
              </Link>
          </div>
      );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold">Избранные вопросы</h1>
                <p className="text-muted-foreground">
                    Выбрано вопросов: {favoriteQuestions.length}. Удалите лишние перед началом.
                </p>
            </div>
            <Link to="/dashboard">
                <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                </Button>
            </Link>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Список вопросов</CardTitle>
                <CardDescription>
                    Нажмите на значок корзины, чтобы убрать вопрос из этого списка.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {favoriteQuestions.map((q, index) => (
                            <div 
                                key={q.id} 
                                className="flex gap-4 items-start p-4 border rounded-lg hover:bg-muted/40 transition-colors group"
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="font-medium text-sm text-muted-foreground mb-1">
                                        Вопрос #{index + 1}
                                    </div>
                                    <p className="text-base leading-relaxed">{q.text}</p>
                                    
                                    {/* Показываем правильный ответ мелким текстом для самопроверки */}
                                    <div className="text-xs text-muted-foreground mt-2">
                                        Ответ: <span className="font-medium text-green-600 dark:text-green-400">
                                            {q.variants[q.correctVariantIndex]}
                                        </span>
                                    </div>
                                </div>
                                
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => toggleFavorite(q.id)}
                                    title="Удалить из избранного"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
                <div className="text-sm text-muted-foreground">
                    Всего вопросов: <b>{favoriteQuestions.length}</b>
                </div>
                <Button size="lg" onClick={handleStart} disabled={favoriteQuestions.length === 0} className="w-full sm:w-auto px-8">
                    <Play className="mr-2 h-4 w-4" /> 
                    Запустить тест
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}