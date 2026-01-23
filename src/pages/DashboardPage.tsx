import { useQuiz } from "@/context/QuizContext";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function DashboardPage() {
  const { quizzes, createFavoritesQuiz } = useQuiz();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter out the internal favorites quiz from the display list if we want,
  // or show it. Let's filter it out to keep the list clean, and use the special button.
  const displayQuizzes = quizzes.filter(q => q.id !== "favorites-quiz");

  const handlePlayFavorites = () => {
      if (!user || user.favorites.length === 0) {
          alert("You have no favorite questions yet.");
          return;
      }
      const favQuiz = createFavoritesQuiz(user.favorites);
      if (favQuiz) {
          navigate(`/quiz/${favQuiz.id}/setup`);
      } else {
          alert("Could not generate favorites quiz (Questions might have been deleted).");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Available Quizzes</h1>
          <Button variant="secondary" onClick={handlePlayFavorites} disabled={!user || user.favorites.length === 0}>
              <Star className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
              Take Favorites Quiz
          </Button>
      </div>

      {displayQuizzes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No quizzes available.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayQuizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.questions.length} Questions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{quiz.description}</p>
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
