import { useParams, Link } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, LayoutDashboard, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
    const { quizId, attemptId } = useParams();
    const { getQuiz, attempts } = useQuiz();
    const { user } = useAuth();
    const { t } = useLanguage();

    const quiz = getQuiz(quizId || "");
    const attempt = attempts.find(a => a.id === attemptId);

    if (!quiz || !attempt) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">{t('resultNotFound')}</p>
            </div>
        );
    }

    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

    const userAttempts = attempts.filter(a => a.quizId === quizId && a.userId === (user?.id || "anonymous"));
    const bestScore = userAttempts.reduce((max, a) => Math.max(max, a.score), 0);
    const bestPercentage = Math.round((bestScore / attempt.totalQuestions) * 100);

    let message = "";
    let colorClass = "";

    if (percentage === 100) {
        message = t('resultPerfect');
        colorClass = "text-green-600 dark:text-green-400";
    } else if (percentage >= 80) {
        message = t('resultGood');
        colorClass = "text-green-500 dark:text-green-400";
    } else if (percentage >= 50) {
        message = t('resultAverage');
        colorClass = "text-yellow-600 dark:text-yellow-400";
    } else {
        message = t('resultBad');
        colorClass = "text-red-500 dark:text-red-400";
    }

    return (
        <div className="flex justify-center items-center min-h-[60vh] p-4">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('results')}</CardTitle>
                    <p className="text-muted-foreground font-medium">{quiz.title}</p>
                </CardHeader>

                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <div className={cn("text-6xl font-extrabold tracking-tighter transition-colors", colorClass)}>
                            {percentage}%
                        </div>
                        <p className="text-lg font-medium">{message}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('correctAnswers')}: <span className="font-bold text-foreground">{attempt.score}</span> {t('outOf')} {attempt.totalQuestions}
                        </p>
                    </div>

                    <Progress
                        value={percentage}
                        className={cn("h-3", percentage < 50 ? "[&>div]:bg-red-500" : percentage < 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                <Trophy className="w-4 h-4 text-yellow-500" /> {t('bestScore')}
                            </div>
                            <p className="text-2xl font-bold">{bestPercentage}%</p>
                        </div>
                        <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                <Target className="w-4 h-4 text-blue-500" /> {t('attemptsCount')}
                            </div>
                            <p className="text-2xl font-bold">{userAttempts.length}</p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 pt-2 pb-6">
                    <Link to="/dashboard" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t('goHome')}
                        </Button>
                    </Link>

                    {percentage < 100 && (
                        <Link
                            to={`/quiz/${quiz.id}/setup`}
                            state={{ retakeMistakes: true, attemptId: attempt.id }}
                            className="w-full sm:w-auto"
                        >
                            <Button variant="secondary" className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-100 dark:border-blue-800">
                                <Target className="mr-2 h-4 w-4" />
                                {t('retakeMistakes')}
                            </Button>
                        </Link>
                    )}

                    <Link to={`/quiz/${quiz.id}/setup`} className="w-full sm:w-auto">
                        <Button className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('retakeAll')}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}