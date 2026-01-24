import { useParams, Link } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, LayoutDashboard, Target } from "lucide-react"; // Добавил иконки
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const { quizId, attemptId } = useParams();
  const { getQuiz, attempts } = useQuiz();
  const { user } = useAuth();

  const quiz = getQuiz(quizId || "");
  const attempt = attempts.find(a => a.id === attemptId);

  if (!quiz || !attempt) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-muted-foreground">Результат не найден</p>
        </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

  // Вычисляем лучший результат
  const userAttempts = attempts.filter(a => a.quizId === quizId && a.userId === (user?.id || "anonymous"));
  const bestScore = userAttempts.reduce((max, a) => Math.max(max, a.score), 0);
  const bestPercentage = Math.round((bestScore / attempt.totalQuestions) * 100);

  // Определяем цвет и сообщение в зависимости от успеха
  let message = "";
  let colorClass = "";

  if (percentage === 100) {
      message = "Идеально! Вы мастер! 🎉";
      colorClass = "text-green-600 dark:text-green-400";
  } else if (percentage >= 80) {
      message = "Отличный результат! 🌟";
      colorClass = "text-green-500 dark:text-green-400";
  } else if (percentage >= 50) {
      message = "Неплохо, но можно лучше 👍";
      colorClass = "text-yellow-600 dark:text-yellow-400";
  } else {
      message = "Попробуйте еще раз, у вас получится! 💪";
      colorClass = "text-red-500 dark:text-red-400";
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Результаты теста</CardTitle>
          <p className="text-muted-foreground font-medium">{quiz.title}</p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Блок с основным счетом */}
          <div className="space-y-2">
              <div className={cn("text-6xl font-extrabold tracking-tighter transition-colors", colorClass)}>
                  {percentage}%
              </div>
              <p className="text-lg font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                  Верных ответов: <span className="font-bold text-foreground">{attempt.score}</span> из {attempt.totalQuestions}
              </p>
          </div>

          <Progress 
            value={percentage} 
            className={cn("h-3", percentage < 50 ? "[&>div]:bg-red-500" : percentage < 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} 
          />

          {/* Статистика в плитках */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Trophy className="w-4 h-4 text-yellow-500" /> Рекорд
                  </div>
                  <p className="text-2xl font-bold">{bestPercentage}%</p>
              </div>
              <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                   <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Target className="w-4 h-4 text-blue-500" /> Попыток
                  </div>
                  <p className="text-2xl font-bold">{userAttempts.length}</p>
              </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-2 pb-6">
            <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    К списку тестов
                </Button>
            </Link>
            
            <Link to={`/quiz/${quiz.id}/setup`} className="w-full sm:w-auto">
                <Button className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Пройти еще раз
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}