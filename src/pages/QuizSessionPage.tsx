import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Heart, Timer } from "lucide-react";

interface QuizState {
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  mode: "practice" | "exam";
  timerMinutes: number;
}

export default function QuizSessionPage() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuiz, addAttempt } = useQuiz();
  const { user, toggleFavorite } = useAuth();

  const settings = (location.state as QuizState) || {
    randomizeQuestions: false,
    randomizeAnswers: false,
    mode: "practice",
    timerMinutes: 0
  };

  const quiz = getQuiz(quizId || "");

  // Prepare questions on mount
  const questions = useMemo(() => {
    if (!quiz) return [];
    let qs = [...quiz.questions];
    if (settings.randomizeQuestions) {
        qs = qs.sort(() => Math.random() - 0.5);
    }

    // Process variants for each question
    return qs.map(q => {
        let variants = q.variants.map((v, i) => ({ text: v, originalIndex: i }));
        if (settings.randomizeAnswers) {
            variants = variants.sort(() => Math.random() - 0.5);
        }
        return { ...q, displayVariants: variants };
    });
  }, [quiz, settings.randomizeQuestions, settings.randomizeAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // qId -> originalIndex
  const [timeLeft, setTimeLeft] = useState(settings.timerMinutes * 60);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState<Record<string, boolean>>({});
  const [disabledVariants, setDisabledVariants] = useState<Record<string, number[]>>({}); // qId -> array of originalIndices to hide

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (settings.mode === 'exam' && settings.timerMinutes > 0) {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [settings.mode, settings.timerMinutes]);

  if (!quiz || questions.length === 0) return <div>Loading or Invalid Quiz...</div>;

  const handleAnswer = (variantOriginalIndex: number) => {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: variantOriginalIndex }));
  };

  const useFiftyFifty = () => {
      if (fiftyFiftyUsed[currentQuestion.id]) return;

      const correctIndex = currentQuestion.correctVariantIndex;
      const incorrectIndices = currentQuestion.displayVariants
        .filter(v => v.originalIndex !== correctIndex)
        .map(v => v.originalIndex);

      // Shuffle incorrect indices and take 2 (or all if less than 2)
      const shuffledIncorrect = incorrectIndices.sort(() => Math.random() - 0.5);
      const toRemove = shuffledIncorrect.slice(0, 2);

      setDisabledVariants(prev => ({ ...prev, [currentQuestion.id]: toRemove }));
      setFiftyFiftyUsed(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const finishQuiz = () => {
      // Calculate score
      let score = 0;
      questions.forEach(q => {
          if (answers[q.id] === q.correctVariantIndex) {
              score++;
          }
      });

      const attemptId = crypto.randomUUID();
      addAttempt({
          id: attemptId,
          quizId: quiz.id,
          userId: user?.id || "anonymous",
          score,
          totalQuestions: questions.length,
          answers,
          date: new Date().toISOString()
      });

      navigate(`/quiz/${quiz.id}/results/${attemptId}`);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isAnswered = answers[currentQuestion.id] !== undefined;
  const canChangeAnswer = settings.mode === 'exam';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            {settings.mode === 'exam' && settings.timerMinutes > 0 && (
                <div className={cn("flex items-center gap-2 font-mono text-xl", timeLeft < 60 && "text-red-500 animate-pulse")}>
                    <Timer className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>

        <Progress value={((currentIndex + 1) / questions.length) * 100} />

        <Card>
            <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
                <CardTitle className="text-lg">Question {currentIndex + 1} of {questions.length}</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={useFiftyFifty}
                        disabled={fiftyFiftyUsed[currentQuestion.id] || (isAnswered && settings.mode === 'practice')}
                    >
                        50/50
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(currentQuestion.id)}
                        className={cn(user?.favorites.includes(currentQuestion.id) ? "text-red-500" : "text-muted-foreground")}
                    >
                        <Heart className="w-5 h-5 fill-current" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <p className="text-xl font-medium">{currentQuestion.text}</p>

                <div className="grid gap-3">
                    {currentQuestion.displayVariants.map((v, idx) => {
                        const isSelected = answers[currentQuestion.id] === v.originalIndex;
                        const isCorrectVariant = v.originalIndex === currentQuestion.correctVariantIndex;
                        const isDisabled = disabledVariants[currentQuestion.id]?.includes(v.originalIndex);

                        let variantClass = "justify-start text-left h-auto py-4 px-4 text-base";

                        if (settings.mode === 'practice' && isAnswered) {
                            if (isCorrectVariant) variantClass += " bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800";
                            else if (isSelected) variantClass += " bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800";
                            else variantClass += " opacity-50";
                        } else if (isSelected) {
                            variantClass += " border-primary ring-1 ring-primary";
                        }

                        if (isDisabled) {
                            variantClass += " opacity-20 pointer-events-none";
                        }

                        return (
                            <Button
                                key={idx}
                                variant="outline"
                                className={variantClass}
                                onClick={() => (canChangeAnswer || !isAnswered) && handleAnswer(v.originalIndex)}
                                disabled={(isAnswered && settings.mode === 'practice') || isDisabled}
                            >
                                <span className="mr-2 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                {v.text}
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="ghost"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                >
                    Previous
                </Button>

                {currentIndex === questions.length - 1 ? (
                    <Button onClick={finishQuiz}>Finish Quiz</Button>
                ) : (
                    <Button onClick={() => setCurrentIndex(prev => prev + 1)}>Next</Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
