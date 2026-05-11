import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flag, Heart, Loader2, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function QuizSessionPage() {
    const { quizId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { getQuiz, addAttempt, attempts } = useQuiz();
    const { user, toggleFavorite } = useAuth();
    const { t } = useLanguage();

    const settings = (location.state as QuizState) || {
        randomizeQuestions: false,
        randomizeAnswers: false,
        mode: "practice",
        timerMinutes: 0,
        selectedRange: "all",
        retakeMistakes: false,
        previousAttemptId: null
    };

    const quiz = getQuiz(quizId || "");

    const questions = useMemo(() => {
        if (!quiz) return [];
        let qs = [...quiz.questions];

        if (settings.retakeMistakes && settings.previousAttemptId) {
            const prevAttempt = attempts.find(a => a.id === settings.previousAttemptId);
            if (prevAttempt) {
                qs = qs.filter(q =>
                    prevAttempt.answers[q.id] !== undefined &&
                    prevAttempt.answers[q.id] !== q.correctVariantIndex
                );
            }
        }

        if (settings.selectedRange && settings.selectedRange !== "all") {
            const [start, end] = settings.selectedRange.split("-").map(Number);
            qs = qs.slice(start, end);
        }

        if (settings.randomizeQuestions) {
            qs = qs.sort(() => Math.random() - 0.5);
        }

        return qs.map(q => {
            let variants = q.variants.map((v, i) => ({ text: v, originalIndex: i }));
            if (settings.randomizeAnswers) {
                variants = variants.sort(() => Math.random() - 0.5);
            }
            return { ...q, displayVariants: variants };
        });
    }, [quiz, settings, attempts]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState(settings.timerMinutes * 60);
    const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState<Record<string, boolean>>({});
    const [disabledVariants, setDisabledVariants] = useState<Record<string, number[]>>({});

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

    if (!quiz || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground p-6 text-center">
                {quiz ? (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Flag className="h-8 w-8 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{t('noQuestionsFound')}</h3>
                        <p className="max-w-xs mx-auto text-sm">
                            {settings.retakeMistakes
                                ? t('congratsNoMistakes')
                                : t('noQuestionsFound')}
                        </p>
                        <Button onClick={() => navigate("/dashboard")} variant="outline" className="mt-4">
                            {t('goHome')}
                        </Button>
                    </div>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>{t('authChecking')}</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                <h2 className="text-xl font-bold line-clamp-1 pr-10 sm:pr-0">{quiz.title}</h2>

                <div className="flex items-center gap-4">
                    {settings.mode === 'exam' && settings.timerMinutes > 0 && (
                        <div className={cn(
                            "flex items-center gap-2 font-mono text-xl px-3 py-1 rounded-md border bg-background",
                            timeLeft < 60 ? "text-red-500 border-red-200 animate-pulse bg-red-50 dark:bg-red-900/20" : "text-foreground"
                        )}>
                            <Timer className="w-5 h-5" />
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                        className="hover:bg-red-500 dark:hover:bg-red-900/20 hover:text-white transition-colors"
                        title={t('exit')}
                    >
                        {t('exit')}
                    </Button>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('progress')}</span>
                    <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
            </div>

            <Card className="mt-4 shadow-md">
                <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2 border-b bg-muted/30">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                            {t('question')} {currentIndex + 1} {t('outOf')} {questions.length}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={useFiftyFifty}
                            disabled={fiftyFiftyUsed[currentQuestion.id] || (isAnswered && settings.mode === 'practice')}
                            className="text-xs font-bold"
                        >
                            50/50
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(currentQuestion.id)}
                            className={cn("hover:bg-red-50 dark:hover:bg-red-900/20", user?.favorites.includes(currentQuestion.id) ? "text-red-500" : "text-muted-foreground")}
                            title={user?.favorites.includes(currentQuestion.id) ? t('favorites') : t('favorites')}
                        >
                            <Heart className={cn("w-5 h-5", user?.favorites.includes(currentQuestion.id) && "fill-current")} />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <p className="text-xl font-medium leading-relaxed">{currentQuestion.text}</p>

                    <div className="grid gap-3">
                        {currentQuestion.displayVariants.map((v, idx) => {
                            const isSelected = answers[currentQuestion.id] === v.originalIndex;
                            const isCorrectVariant = v.originalIndex === currentQuestion.correctVariantIndex;
                            const isDisabled = disabledVariants[currentQuestion.id]?.includes(v.originalIndex);

                            let variantClass = "justify-start text-left h-auto py-4 px-4 text-base relative transition-all";

                            if (settings.mode === 'practice' && isAnswered) {
                                if (isCorrectVariant) {
                                    variantClass += " bg-green-100 dark:bg-green-900/40 border-green-500 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800/50";
                                } else if (isSelected) {
                                    variantClass += " bg-red-100 dark:bg-red-900/40 border-red-500 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800/50";
                                } else {
                                    variantClass += " opacity-50 grayscale";
                                }
                            } else if (isSelected) {
                                variantClass += " border-primary ring-1 ring-primary bg-primary/5";
                            }

                            if (isDisabled) {
                                variantClass += " opacity-20 pointer-events-none grayscale";
                            }

                            return (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className={variantClass}
                                    onClick={() => (canChangeAnswer || !isAnswered) && handleAnswer(v.originalIndex)}
                                    disabled={(isAnswered && settings.mode === 'practice') || isDisabled}
                                >
                                    <div className="flex items-center w-full">
                                        <span className="flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold rounded-full border bg-background text-muted-foreground shrink-0">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1">{v.text}</span>

                                        {settings.mode === 'practice' && isAnswered && isCorrectVariant && (
                                            <span className="ml-2 text-green-600 font-bold">✓</span>
                                        )}
                                    </div>
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-muted/10 pt-4">
                    <Button
                        variant="ghost"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" /> {t('back')}
                    </Button>

                    {currentIndex === questions.length - 1 ? (
                        <Button onClick={finishQuiz} size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <Flag className="h-4 w-4" /> {t('finish')}
                        </Button>
                    ) : (
                        <Button onClick={() => setCurrentIndex(prev => prev + 1)} className="gap-1">
                            {t('next')} <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
