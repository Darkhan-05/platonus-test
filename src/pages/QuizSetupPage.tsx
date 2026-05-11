import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Clock, Shuffle, BookOpen, UserPlus, Info, LayoutDashboard, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function QuizSetupPage() {
  const { quizId } = useParams();
  const { getQuiz, isGuestAttemptLimitReached } = useQuiz();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const quiz = getQuiz(quizId || "");

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [timerMinutes, setTimerMinutes] = useState<string>("0");
  const [selectedRange, setSelectedRange] = useState<string>("all");

  const retakeMistakes = location.state?.retakeMistakes || false;
  const previousAttemptId = location.state?.attemptId || null;

  const isGuest = !user;
  const attemptLimitReached = isGuest && isGuestAttemptLimitReached();

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center p-6">
          <CardTitle className="mb-2">{t('quizNotFound')}</CardTitle>
          <Button onClick={() => navigate("/dashboard")}>{t('goHome')}</Button>
        </Card>
      </div>
    );
  }

  const handleStart = () => {
    navigate(`/quiz/${quiz.id}/play`, {
      state: {
        randomizeQuestions,
        randomizeAnswers,
        mode,
        timerMinutes: parseInt(timerMinutes) || 0,
        selectedRange,
        retakeMistakes,
        previousAttemptId
      }
    });
  };

  const questionCount = quiz.questions.length;
  const ranges = [];
  if (questionCount > 50) {
    for (let i = 0; i < questionCount; i += 50) {
      const end = Math.min(i + 50, questionCount);
      ranges.push({
        label: `${t('question')} ${i + 1}-${end}`,
        value: `${i}-${end}`
      });
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('setupQuiz')}</span>
          </div>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.questions.length} {t('questionsCount')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {retakeMistakes && (
            <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>{t('retakeMistakes')}</AlertTitle>
              <AlertDescription>
                {t('mistakesMode')}
              </AlertDescription>
            </Alert>
          )}

          {attemptLimitReached && !retakeMistakes && (
            <Alert className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>{t('limitReached')}</AlertTitle>
              <AlertDescription>
                {t('guestLimitDesc')}
              </AlertDescription>
            </Alert>
          )}

          {ranges.length > 0 && !retakeMistakes && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium leading-none flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> {t('chooseRange')}
              </h3>
              <RadioGroup defaultValue="all" onValueChange={setSelectedRange} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="all" id="range-all" />
                  <Label htmlFor="range-all" className="flex-1 cursor-pointer text-xs font-semibold">{t('allQuestions')} ({questionCount})</Label>
                </div>
                {ranges.map((r, idx) => (
                  <div key={idx} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={r.value} id={`range-${idx}`} />
                    <Label htmlFor={`range-${idx}`} className="flex-1 cursor-pointer text-xs font-semibold">{r.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
              <Shuffle className="h-4 w-4" /> {t('order')}
            </h3>
            <div className="grid gap-4 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label htmlFor="rand-q" className="cursor-pointer">{t('randomizeQuestions')}</Label>
                <Switch id="rand-q" checked={randomizeQuestions} onCheckedChange={setRandomizeQuestions} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="rand-a" className="cursor-pointer">{t('randomizeAnswers')}</Label>
                <Switch id="rand-a" checked={randomizeAnswers} onCheckedChange={setRandomizeAnswers} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> {t('mode')}
            </h3>
            <RadioGroup defaultValue="practice" onValueChange={(v) => setMode(v as any)} className="grid gap-2">
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="practice" id="mode-practice" />
                <Label htmlFor="mode-practice" className="flex-1 cursor-pointer">
                  <span className="font-semibold block">{t('practice')}</span>
                  <span className="text-xs text-muted-foreground">{t('practiceDesc')}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="exam" id="mode-exam" />
                <Label htmlFor="mode-exam" className="flex-1 cursor-pointer">
                  <span className="font-semibold block">{t('exam')}</span>
                  <span className="text-xs text-muted-foreground">{t('examDesc')}</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === 'exam' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="timer" className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" /> {t('timerLimit')}
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
                <span className="text-xs text-muted-foreground">{t('timerDesc')}</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-2">
          <Button variant="outline" className="w-1/3" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
          </Button>

          {attemptLimitReached ? (
            <Button className="w-2/3 bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => navigate("/register")}>
              <UserPlus className="mr-2 h-4 w-4" /> {t('register')}
            </Button>
          ) : (
            <Button className="w-2/3" size="lg" onClick={handleStart}>
              <Play className="mr-2 h-4 w-4" /> {t('startTest')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
