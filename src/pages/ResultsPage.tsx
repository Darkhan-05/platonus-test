import { useParams, Link } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ResultsPage() {
  const { quizId, attemptId } = useParams();
  const { getQuiz, attempts } = useQuiz();
  const { user } = useAuth();

  const quiz = getQuiz(quizId || "");
  const attempt = attempts.find(a => a.id === attemptId);

  if (!quiz || !attempt) return <div>Result not found</div>;

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

  // Calculate best result
  const userAttempts = attempts.filter(a => a.quizId === quizId && a.userId === (user?.id || "anonymous"));
  const bestScore = userAttempts.reduce((max, a) => Math.max(max, a.score), 0);
  const bestPercentage = Math.round((bestScore / attempt.totalQuestions) * 100);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
              <p className="text-lg text-muted-foreground">{quiz.title}</p>
              <h2 className="text-5xl font-bold mt-2">{percentage}%</h2>
              <p className="text-muted-foreground mt-1">
                  You scored {attempt.score} out of {attempt.totalQuestions}
              </p>
          </div>

          <Progress value={percentage} className="h-4" />

          <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Best</p>
                  <p className="text-2xl font-bold">{bestPercentage}%</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                   <p className="text-sm text-muted-foreground">Total Attempts</p>
                   <p className="text-2xl font-bold">{userAttempts.length}</p>
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
            <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link to={`/quiz/${quiz.id}/setup`}>
                <Button>Try Again</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
