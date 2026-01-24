import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flag, Heart, Loader2, Timer } from "lucide-react"; // Добавил иконки навигации
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

    // Получаем настройки или ставим значения по умолчанию
    const settings = (location.state as QuizState) || {
        randomizeQuestions: false,
        randomizeAnswers: false,
        mode: "practice",
        timerMinutes: 0
    };

    const quiz = getQuiz(quizId || "");

    // Подготовка вопросов при монтировании компонента
    const questions = useMemo(() => {
        if (!quiz) return [];
        let qs = [...quiz.questions];

        // Перемешивание вопросов
        if (settings.randomizeQuestions) {
            qs = qs.sort(() => Math.random() - 0.5);
        }

        // Обработка вариантов ответов
        return qs.map(q => {
            let variants = q.variants.map((v, i) => ({ text: v, originalIndex: i }));
            // Перемешивание вариантов
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

    // Логика таймера
    useEffect(() => {
        if (settings.mode === 'exam' && settings.timerMinutes > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        finishQuiz(); // Авто-завершение
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [settings.mode, settings.timerMinutes]);

    // Экран загрузки или ошибки
    if (!quiz || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Загрузка теста...</p>
            </div>
        );
    }

    const handleAnswer = (variantOriginalIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: variantOriginalIndex }));
    };

    const useFiftyFifty = () => {
        if (fiftyFiftyUsed[currentQuestion.id]) return;

        const correctIndex = currentQuestion.correctVariantIndex;
        const incorrectIndices = currentQuestion.displayVariants
            .filter(v => v.originalIndex !== correctIndex)
            .map(v => v.originalIndex);

        // Перемешиваем неправильные и берем 2 (или все, если их меньше 2)
        const shuffledIncorrect = incorrectIndices.sort(() => Math.random() - 0.5);
        const toRemove = shuffledIncorrect.slice(0, 2);

        setDisabledVariants(prev => ({ ...prev, [currentQuestion.id]: toRemove }));
        setFiftyFiftyUsed(prev => ({ ...prev, [currentQuestion.id]: true }));
    };

    const finishQuiz = () => {
        // Подсчет очков
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
    // В режиме экзамена можно менять ответ, в тренировке - нет (сразу показывается результат)
    const canChangeAnswer = settings.mode === 'exam';

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-4">
            {/* Верхняя панель: Заголовок и Таймер */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold line-clamp-1">{quiz.title}</h2>

                {settings.mode === 'exam' && settings.timerMinutes > 0 && (
                    <div className={cn(
                        "flex items-center gap-2 font-mono text-xl px-3 py-1 rounded-md border bg-background",
                        timeLeft < 60 ? "text-red-500 border-red-200 animate-pulse bg-red-50 dark:bg-red-900/20" : "text-foreground"
                    )}>
                        <Timer className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Прогресс бар */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Прогресс</span>
                    <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
            </div>

            <Card className="mt-4 shadow-md">
                <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2 border-b bg-muted/30">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                            Вопрос {currentIndex + 1} из {questions.length}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {/* Кнопка 50/50 */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={useFiftyFifty}
                            disabled={fiftyFiftyUsed[currentQuestion.id] || (isAnswered && settings.mode === 'practice')}
                            title="Убрать два неверных ответа"
                            className="text-xs font-bold"
                        >
                            50/50
                        </Button>

                        {/* Кнопка Избранное */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(currentQuestion.id)}
                            className={cn("hover:bg-red-50 dark:hover:bg-red-900/20", user?.favorites.includes(currentQuestion.id) ? "text-red-500" : "text-muted-foreground")}
                            title={user?.favorites.includes(currentQuestion.id) ? "Убрать из избранного" : "В избранное"}
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

                            // Логика подсветки (цвета)
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

                                        {/* Иконки результата в режиме тренировки */}
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
                        <ChevronLeft className="h-4 w-4" /> Назад
                    </Button>

                    {currentIndex === questions.length - 1 ? (
                        <Button onClick={finishQuiz} size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <Flag className="h-4 w-4" /> Завершить тест
                        </Button>
                    ) : (
                        <Button onClick={() => setCurrentIndex(prev => prev + 1)} className="gap-1">
                            Далее <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}