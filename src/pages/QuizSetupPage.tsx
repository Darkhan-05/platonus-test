import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuiz } from "@/context/QuizContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

export default function QuizSetupPage() {
  const { quizId } = useParams();
  const { getQuiz } = useQuiz();
  const navigate = useNavigate();
  const quiz = getQuiz(quizId || "");

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [timerMinutes, setTimerMinutes] = useState<string>("0");

  if (!quiz) {
    return <div>Quiz not found</div>;
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
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Setup: {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="rand-q">Randomize Question Order</Label>
            <Switch id="rand-q" checked={randomizeQuestions} onCheckedChange={setRandomizeQuestions} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rand-a">Randomize Answer Order</Label>
            <Switch id="rand-a" checked={randomizeAnswers} onCheckedChange={setRandomizeAnswers} />
          </div>

          <div className="space-y-3">
             <Label>Mode</Label>
             <RadioGroup defaultValue="practice" onValueChange={(v) => setMode(v as any)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="practice" id="mode-practice" />
                    <Label htmlFor="mode-practice">Practice (Immediate Feedback)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exam" id="mode-exam" />
                    <Label htmlFor="mode-exam">Exam (Timed, Feedback at end)</Label>
                </div>
             </RadioGroup>
          </div>

          {mode === 'exam' && (
             <div className="space-y-2">
                <Label htmlFor="timer">Timer (Minutes, 0 for no limit)</Label>
                <Input
                    id="timer"
                    type="number"
                    min="0"
                    value={timerMinutes}
                    onChange={e => setTimerMinutes(e.target.value)}
                />
             </div>
          )}
        </CardContent>
        <CardFooter>
            <Button className="w-full" size="lg" onClick={handleStart}>Start Quiz</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
