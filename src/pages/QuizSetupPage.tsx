import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Clock, Shuffle, BookOpen } from "lucide-react"; // Добавим иконки для красоты

export default function QuizSetupPage() {
  const { quizId } = useParams();
  const { getQuiz } = useQuiz();
  const navigate = useNavigate();
  const quiz = getQuiz(quizId || "");

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [timerMinutes, setTimerMinutes] = useState<string>("0");

  // Улучшенный экран "Не найдено"
  if (!quiz) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center p-6">
                <CardTitle className="mb-2">Тест не найден</CardTitle>
                <CardDescription className="mb-4">Возможно, он был удален или ссылка некорректна.</CardDescription>
                <Button onClick={() => navigate("/dashboard")}>Вернуться на главную</Button>
            </Card>
        </div>
    );
  }

  const handleStart = () => {
    // Pass settings via state to the quiz page
    navigate(`/quiz/${quiz.id}/play`, {
      state: {
        randomizeQuestions,
        randomizeAnswers,
        mode,
        timerMinutes: parseInt(timerMinutes) || 0
      }
    });
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Настройка теста</span>
          </div>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.questions.length} вопросов • Выберите параметры прохождения
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Блок перемешивания */}
          <div className="space-y-4">
              <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Shuffle className="h-4 w-4" /> Порядок
              </h3>
              <div className="grid gap-4 border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rand-q" className="cursor-pointer">Перемешать вопросы</Label>
                    <Switch id="rand-q" checked={randomizeQuestions} onCheckedChange={setRandomizeQuestions} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rand-a" className="cursor-pointer">Перемешать варианты ответов</Label>
                    <Switch id="rand-a" checked={randomizeAnswers} onCheckedChange={setRandomizeAnswers} />
                  </div>
              </div>
          </div>

          {/* Блок режима */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Режим прохождения
             </h3>
             <RadioGroup defaultValue="practice" onValueChange={(v) => setMode(v as any)} className="grid gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="practice" id="mode-practice" />
                    <Label htmlFor="mode-practice" className="flex-1 cursor-pointer">
                        <span className="font-semibold block">Тренировка</span>
                        <span className="text-xs text-muted-foreground">Показывает правильный ответ сразу после выбора.</span>
                    </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="exam" id="mode-exam" />
                    <Label htmlFor="mode-exam" className="flex-1 cursor-pointer">
                        <span className="font-semibold block">Экзамен</span>
                        <span className="text-xs text-muted-foreground">Результат и ошибки только в конце теста.</span>
                    </Label>
                </div>
             </RadioGroup>
          </div>

          {/* Таймер (появляется только в режиме экзамена) */}
          {mode === 'exam' && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="timer" className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" /> Ограничение времени (минуты)
                </Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id="timer"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={timerMinutes}
                        onChange={e => setTimerMinutes(e.target.value)}
                        className="max-w-[120px]"
                    />
                    <span className="text-xs text-muted-foreground">0 = без ограничений</span>
                </div>
             </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-2">
            {/* Кнопка НАЗАД */}
            <Button variant="outline" className="w-1/3" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Назад
            </Button>
            
            {/* Кнопка НАЧАТЬ */}
            <Button className="w-2/3" size="lg" onClick={handleStart}>
                <Play className="mr-2 h-4 w-4" /> Начать тест
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}