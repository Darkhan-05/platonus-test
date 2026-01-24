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
import { Trash2, Loader2, FileText, Keyboard } from "lucide-react";
import mammoth from "mammoth";
import { generateQuestionVariants } from "@/lib/gemini";

export default function CreateQuizPage() {
  const { user } = useAuth();
  const { addQuiz } = useQuiz();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
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
          if (variants.length === 0) {
              // Gemini logic
              try {
                  const generatedVariants = await generateQuestionVariants(questionText);
                  variants = generatedVariants;
              } catch (e) {
                  console.error("Gemini failed for", questionText);
                  variants = ["Ошибка генерации вариантов"];
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
            alert("Неподдерживаемый формат. Пожалуйста, используйте .docx, .doc или .txt");
            setIsProcessing(false);
            return;
        }

        const questions = await parseTextContent(text);
        setParsedQuestions([...parsedQuestions, ...questions]);

    } catch (err) {
        console.error(err);
        alert("Ошибка при чтении файла.");
    }

    setIsProcessing(false);
  };

  const handleSave = () => {
    const newQuiz: Quiz = {
        id: crypto.randomUUID(),
        title: title || parsedQuestions[0].text,
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
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
        <div>
            <h1 className="text-3xl font-bold">Создание нового теста</h1>
            <p className="text-muted-foreground mt-2">
                Добавляйте вопросы вручную или загрузите файл с готовым списком (.docx, .txt).
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Название теста</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Например: Основы высшей математики" 
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Добавление вопросов</CardTitle>
                <CardDescription className="leading-relaxed">
                    Используйте формат: <br/><code>&lt;question&gt;Текст вопроса <br/>&lt;variant&gt;Правильный ответ<br/>&lt;variant&gt;Неправильный ответ</code>
                    <br/>
                    <span className="inline-block mt-2 p-2 bg-blue-50 text-blue-800 rounded text-xs font-medium dark:bg-blue-900/30 dark:text-blue-200">
                        ✨ <b>Gemini AI:</b> Если вы укажете только тег <code>&lt;question&gt;</code> без вариантов, 
                        искусственный интеллект сгенерирует ответы автоматически.
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manual">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                            <Keyboard className="h-4 w-4"/> Ручной ввод
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <FileText className="h-4 w-4"/> Загрузка файла
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Текст с вопросами</Label>
                            <Textarea
                                className="min-h-[150px] font-mono text-sm leading-relaxed"
                                placeholder={"<question>Сколько будет 2+2? \n<variant>4 \n<variant>3\n<question>Столица Франции?"}
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleTextParse} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProcessing ? "Обработка..." : "Распознать вопросы"}
                        </Button>
                    </TabsContent>
                    
                    <TabsContent value="upload" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Выберите файл (.docx, .doc, .txt)</Label>
                            <Input type="file" accept=".docx,.doc,.txt" onChange={handleFileUpload} disabled={isProcessing} />
                        </div>
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                Анализируем файл и генерируем ответы с помощью AI...
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {parsedQuestions.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Предпросмотр ({parsedQuestions.length} вопросов)</CardTitle>
                    <CardDescription>Проверьте корректность распознавания перед сохранением.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted/10">
                        <div className="space-y-6">
                            {parsedQuestions.map((q, i) => (
                                <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="font-semibold text-sm">
                                            <span className="text-muted-foreground mr-2">#{i+1}</span>
                                            {q.text}
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeQuestion(q.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <ul className="mt-3 space-y-1">
                                        {q.variants.map((v, idx) => (
                                            <li key={idx} className={`text-sm px-2 py-1 rounded ${idx === 0 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 w-fit" : "text-muted-foreground"}`}>
                                                {v} {idx === 0 && "✓ (Верный)"}
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

        <div className="flex justify-end gap-4 pb-10">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Отмена
            </Button>
            <Button size="lg" onClick={handleSave} disabled={parsedQuestions.length === 0}>
                Сохранить тест
            </Button>
        </div>
    </div>
  );
}