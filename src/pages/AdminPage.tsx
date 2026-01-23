import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuiz } from "@/context/QuizContext";

export default function AdminPage() {
  const { quizzes, deleteQuiz, attempts } = useQuiz();

  const getBestScore = (quizId: string) => {
    const quizAttempts = attempts.filter(a => a.quizId === quizId);
    if (quizAttempts.length === 0) return "-";
    const maxScore = Math.max(...quizAttempts.map(a => a.score));
    const total = quizzes.find(q => q.id === quizId)?.questions.length || 0;
    return `${maxScore}/${total}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Management</CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-muted-foreground">No quizzes found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Times Solved</TableHead>
                  <TableHead>Best Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.questions.length}</TableCell>
                    <TableCell>{quiz.timesSolved}</TableCell>
                    <TableCell>{getBestScore(quiz.id)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
