import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuiz } from "@/context/QuizContext";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { quizzes, deleteQuiz } = useQuiz();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Quizzes</h1>
      {quizzes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No quizzes available.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{quiz.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => deleteQuiz(quiz.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription>{quiz.questions.length} Questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                  <span>Solved: {quiz.timesSolved} times</span>
                </div>
                <Link to={`/quiz/${quiz.id}/setup`}>
                  <Button className="w-full">Start Quiz</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
