import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Question, type Quiz } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2 } from "lucide-react";
import mammoth from "mammoth";
import { generateQuestionVariants } from "@/lib/gemini";

export default function CreateQuizPage() {
  const { user } = useAuth();
  const { addQuiz } = useQuiz();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseTextContent = async (text: string) => {
    // Format: <question>Question Text <variant>Option 1 <variant>Option 2
    const parts = text.split("<question>");
    const newQuestions: Question[] = [];

    for (const part of parts) {
      if (!part.trim()) continue;

      const variantParts = part.split("<variant>");
      const questionText = variantParts[0].trim();
      let variants = variantParts.slice(1).map(v => v.trim()).filter(v => v);

      if (questionText) {
          // GEMINI INTEGRATION LOGIC
          if (variants.length === 0) {
              // No variants found, call Gemini
              // We need to set the API Key globally or pass it.
              // For simulation, we assume user might have entered it or it's in env.
              // Here we rely on the lib function which checks env or mocks.

              // If user provided key in UI (for testing), we should ideally use it.
              // But for now let's stick to the lib function logic.
              try {
                  const generatedVariants = await generateQuestionVariants(questionText);
                  variants = generatedVariants;
              } catch (e) {
                  console.error("Gemini failed for", questionText);
                  variants = ["Error generating variants"];
              }
          }

          if (variants.length > 0) {
            newQuestions.push({
                id: crypto.randomUUID(),
                text: questionText,
                variants: variants,
                correctVariantIndex: 0 // Default to first
            });
          }
      }
    }

    return newQuestions;
  };

  const handleTextParse = async () => {
    setIsProcessing(true);
    const questions = await parseTextContent(rawText);
    setParsedQuestions([...parsedQuestions, ...questions]);
    setRawText("");
    setIsProcessing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsProcessing(true);
    let text = "";

    try {
        if (uploadedFile.name.endsWith(".docx") || uploadedFile.name.endsWith(".doc")) {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else if (uploadedFile.name.endsWith(".txt")) {
            text = await uploadedFile.text();
        } else {
            alert("Unsupported format. Please use .docx, .doc, or .txt");
            setIsProcessing(false);
            return;
        }

        const questions = await parseTextContent(text);
        setParsedQuestions([...parsedQuestions, ...questions]);

    } catch (err) {
        console.error(err);
        alert("Error parsing file.");
    }

    setIsProcessing(false);
  };

  const handleSave = () => {
    if (!title || parsedQuestions.length === 0) {
        alert("Please provide a title and at least one question.");
        return;
    }

    const newQuiz: Quiz = {
        id: crypto.randomUUID(),
        title,
        description,
        questions: parsedQuestions,
        createdBy: user?.id || "unknown",
        createdAt: new Date().toISOString(),
        timesSolved: 0
    };

    addQuiz(newQuiz);
    navigate("/dashboard");
  };

  const removeQuestion = (id: string) => {
      setParsedQuestions(parsedQuestions.filter(q => q.id !== id));
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
        <div>
            <h1 className="text-3xl font-bold">Create New Quiz</h1>
            <p className="text-muted-foreground">Add questions manually or upload a file (.docx, .doc, .txt).</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mathematics 101" />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..." />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Add Questions</CardTitle>
                <CardDescription>
                    Format: &lt;question&gt;Text &lt;variant&gt;Correct...
                    <br/>
                    <b>Gemini AI:</b> If you provide only &lt;question&gt; tags without variants, AI will generate them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manual">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual Input</TabsTrigger>
                        <TabsTrigger value="upload">File Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                                className="min-h-[150px] font-mono text-sm"
                                placeholder="<question>What is 2+2? <variant>4 <variant>3"
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleTextParse} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Process Questions
                        </Button>
                    </TabsContent>
                    <TabsContent value="upload" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Upload File (.docx, .doc, .txt)</Label>
                            <Input type="file" accept=".docx,.doc,.txt" onChange={handleFileUpload} disabled={isProcessing} />
                        </div>
                        {isProcessing && <p className="text-sm text-muted-foreground animate-pulse">Processing file and generating AI answers...</p>}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {parsedQuestions.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Preview ({parsedQuestions.length} Questions)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                        <div className="space-y-4">
                            {parsedQuestions.map((q, i) => (
                                <div key={q.id} className="border-b pb-4 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold">Q{i+1}: {q.text}</div>
                                        <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                    <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                                        {q.variants.map((v, idx) => (
                                            <li key={idx} className={idx === 0 ? "text-green-600 font-medium" : ""}>
                                                {v} {idx === 0 && "(Correct)"}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}

        <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button size="lg" onClick={handleSave} disabled={parsedQuestions.length === 0}>Save Quiz</Button>
        </div>
    </div>
  );
}
