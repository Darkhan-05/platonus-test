import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { type Question, type Quiz } from "@/types";
import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateQuizPage() {
    const { user } = useAuth();
    const { addQuiz } = useQuiz();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rawText, setRawText] = useState("");
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);

    const parseText = (text: string) => {
        // Format: <question>Question Text <variant>Option 1 <variant>Option 2
        // Split by <question>, ignore first empty if any
        const parts = text.split("<question>");
        const newQuestions: Question[] = [];

        parts.forEach((part) => {
            if (!part.trim()) return;

            const variantParts = part.split("<variant>");
            const questionText = variantParts[0].trim();
            const variants = variantParts.slice(1).map(v => v.trim()).filter(v => v);

            if (questionText && variants.length > 0) {
                newQuestions.push({
                    id: crypto.randomUUID(),
                    text: questionText,
                    variants: variants,
                    correctVariantIndex: 0 // Default to first
                });
            }
        });

        return newQuestions;
    };

    const handleTextParse = () => {
        const questions = parseText(rawText);
        setParsedQuestions([...parsedQuestions, ...questions]);
        setRawText("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        const text = await uploadedFile.text();
        let questions: Question[] = [];

        if (uploadedFile.name.endsWith(".json")) {
            try {
                const json = JSON.parse(text);
                if (Array.isArray(json)) {
                    questions = json.map((item: any) => ({
                        id: crypto.randomUUID(),
                        text: item.question || item.text,
                        variants: item.variants || item.options || [],
                        correctVariantIndex: 0
                    }));
                }
            } catch (err) {
                alert("Invalid JSON");
            }
        } else if (uploadedFile.name.endsWith(".csv")) {
            // Simple CSV parser: Question, Opt1, Opt2...
            const lines = text.split("\n");
            lines.forEach(line => {
                const cols = line.split(","); // robust CSV parsing is complex, simple split for now
                if (cols.length > 1) {
                    questions.push({
                        id: crypto.randomUUID(),
                        text: cols[0].trim(),
                        variants: cols.slice(1).map(c => c.trim()).filter(c => c),
                        correctVariantIndex: 0
                    });
                }
            });
        }

        setParsedQuestions([...parsedQuestions, ...questions]);
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
                <p className="text-muted-foreground">Add questions manually or upload a file.</p>
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
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="manual">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Input</TabsTrigger>
                            <TabsTrigger value="upload">File Upload</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Question Text (Format: &lt;question&gt;Text &lt;variant&gt;Opt1...)</Label>
                                <Textarea
                                    className="min-h-[150px] font-mono text-sm"
                                    placeholder="<question>What is 2+2? <variant>4 <variant>3 <variant>5"
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleTextParse}>Add Questions</Button>
                        </TabsContent>
                        <TabsContent value="upload" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Upload CSV or JSON</Label>
                                <Input type="file" accept=".csv,.json" onChange={handleFileUpload} />
                                <p className="text-xs text-muted-foreground">JSON format: Array of objects with 'question' and 'variants' fields.</p>
                            </div>
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
                                            <div className="font-semibold">Q{i + 1}: {q.text}</div>
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
                <Button size="lg" onClick={handleSave}>Save Quiz</Button>
            </div>
        </div>
    );
}
