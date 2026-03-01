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
import { Trash2, Loader2, FileText, Keyboard, CheckCircle2, Sparkles } from "lucide-react";
import mammoth from "mammoth";
import { generateQuestionVariants, findCorrectAnswerIndex } from "@/lib/gemini";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function CreateQuizPage() {
    const { user } = useAuth();
    const { addQuiz } = useQuiz();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [title, setTitle] = useState("");
    const [rawText, setRawText] = useState("");
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoFindCorrect, setAutoFindCorrect] = useState(true);
    const [processProgress, setProcessProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    const parseTextContent = async (text: string) => {
        // Format: <question>Question Text <variant>Option 1 <variant>Option 2
        const rawParts = text.split("<question>");
        const parts = rawParts.filter(p => p.trim());
        const newQuestions: Question[] = [];

        const totalSteps = parts.length;
        let completedSteps = 0;

        for (const part of parts) {
            const variantParts = part.split("<variant>");
            const questionText = variantParts[0].trim();
            let variants = variantParts.slice(1).map(v => v.trim()).filter(v => v);

            if (questionText) {
                setStatusMessage(`Обработка вопроса ${completedSteps + 1} из ${totalSteps}...`);

                if (variants.length === 0) {
                    try {
                        const generatedVariants = await generateQuestionVariants(questionText);
                        variants = generatedVariants;
                    } catch (e) {
                        console.error("Gemini failed for", questionText);
                        variants = ["Ошибка генерации вариантов"];
                    }
                }

                if (variants.length > 0) {
                    let correctIndex = 0;

                    if (autoFindCorrect && variants.length > 1) {
                        try {
                            correctIndex = await findCorrectAnswerIndex(questionText, variants);
                        } catch (e) {
                            console.error("Auto-find failed for", questionText);
                        }
                    }

                    newQuestions.push({
                        id: crypto.randomUUID(),
                        text: questionText,
                        variants: variants,
                        correctVariantIndex: correctIndex
                    });
                }
            }

            completedSteps++;
            setProcessProgress((completedSteps / totalSteps) * 100);
        }

        return newQuestions;
    };

    const handleTextParse = async () => {
        if (!rawText.trim()) return;
        setIsProcessing(true);
        setProcessProgress(0);
        try {
            const questions = await parseTextContent(rawText);
            if (questions.length > 0) {
                setParsedQuestions([...parsedQuestions, ...questions]);
                setRawText("");
                toast({
                    title: "Успешно!",
                    description: `Распознано вопросов: ${questions.length}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: "Не удалось найти вопросы в тексте. Проверьте формат.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка распознавания",
                description: "Произошла непредвиденная ошибка при обработке текста.",
            });
        }
        setIsProcessing(false);
        setStatusMessage("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setIsProcessing(true);
        setProcessProgress(0);
        setStatusMessage("Читаем файл...");
        let text = "";

        try {
            if (uploadedFile.name.endsWith(".docx") || uploadedFile.name.endsWith(".doc")) {
                const arrayBuffer = await uploadedFile.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (uploadedFile.name.endsWith(".txt")) {
                text = await uploadedFile.text();
            } else {
                toast({
                    variant: "destructive",
                    title: "Формат не поддерживается",
                    description: "Пожалуйста, используйте .docx, .doc или .txt",
                });
                setIsProcessing(false);
                return;
            }

            const questions = await parseTextContent(text);
            if (questions.length > 0) {
                setParsedQuestions([...parsedQuestions, ...questions]);
                toast({
                    title: "Файл обработан",
                    description: `Добавлено вопросов: ${questions.length}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Вопросы не найдены",
                    description: "В файле не обнаружено вопросов в нужном формате.",
                });
            }

        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Ошибка при чтении файла",
                description: "Не удалось извлечь текст из файла.",
            });
        }

        setIsProcessing(false);
        setStatusMessage("");
    };

    const handleSave = () => {
        try {
            const newQuiz: Quiz = {
                id: crypto.randomUUID(),
                title: title || (parsedQuestions.length > 0 ? parsedQuestions[0].text : "Новый тест"),
                questions: parsedQuestions,
                createdBy: user?.id || "unknown",
                createdAt: new Date().toISOString(),
                timesSolved: 0
            };

            addQuiz(newQuiz);
            toast({
                title: "Тест сохранен!",
                description: "Вы можете найти его в своем дашборде.",
            });
            navigate("/dashboard");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка сохранения",
                description: "Не удалось сохранить ваш тест.",
            });
        }
    };

    const removeQuestion = (id: string) => {
        setParsedQuestions(parsedQuestions.filter(q => q.id !== id));
    };

    const handleFindCorrectAnswer = async (questionId: string) => {
        const question = parsedQuestions.find(q => q.id === questionId);
        if (!question) return;

        setIsProcessing(true);
        setStatusMessage("AI ищет ответ...");
        try {
            const correctIndex = await findCorrectAnswerIndex(question.text, question.variants);
            setParsedQuestions(prev => prev.map(q =>
                q.id === questionId ? { ...q, correctVariantIndex: correctIndex } : q
            ));
            toast({
                title: "Ответ найден!",
                description: `Для вопроса "${question.text.substring(0, 20)}..."`,
            });
        } catch (err) {
            console.error("Failed to find correct answer:", err);
            toast({
                variant: "destructive",
                title: "Ошибка AI",
                description: "Не удалось автоматически найти правильный ответ.",
            });
        } finally {
            setIsProcessing(false);
            setStatusMessage("");
        }
    };

    return (
        <div className="container mx-auto max-w-4xl space-y-8 py-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Создание нового теста</h1>
                <p className="text-muted-foreground mt-2">
                    Добавляйте вопросы вручную или загрузите файл с готовым списком (.docx, .txt).
                </p>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Название теста</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Например: Основы высшей математики"
                            className="bg-muted/30 focus-visible:ring-blue-500"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-blue-500">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Добавление вопросов
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                        Используйте формат: <br /><code>&lt;question&gt;Текст вопроса <br />&lt;variant&gt;Правильный ответ<br />&lt;variant&gt;Неправильный ответ</code>
                        <br />
                        <span className="inline-block mt-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50">
                            ✨ <b>Gemini AI:</b> Если вы укажете только тег <code>&lt;question&gt;</code> без вариантов,
                            искусственный интеллект сгенерирует ответы автоматически.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="manual">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="manual" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Keyboard className="h-4 w-4" /> Ручной ввод
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <FileText className="h-4 w-4" /> Загрузка файла
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Текст с вопросами</Label>
                                <Textarea
                                    className="min-h-[180px] font-mono text-sm leading-relaxed bg-muted/20 border-dashed focus-visible:ring-blue-500"
                                    placeholder={"<question>Сколько будет 2+2? \n<variant>4 \n<variant>3\n<question>Столица Франции?"}
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 shadow-sm">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">Auto-AI: Найти ответы</div>
                                        <div className="text-xs text-muted-foreground">Gemini автоматически выделит верный вариант</div>
                                    </div>
                                </div>
                                <Switch
                                    checked={autoFindCorrect}
                                    onCheckedChange={setAutoFindCorrect}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>

                            {isProcessing ? (
                                <div className="space-y-3 p-4 border rounded-xl bg-muted/30">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            {statusMessage || "Обработка..."}
                                        </div>
                                        <span className="text-muted-foreground font-mono">{Math.round(processProgress)}%</span>
                                    </div>
                                    <Progress value={processProgress} className="h-2 bg-blue-100 dark:bg-blue-900/20" />
                                </div>
                            ) : (
                                <Button onClick={handleTextParse} disabled={isProcessing || !rawText.trim()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-10 px-8 transition-all hover:scale-[1.02]">
                                    Распознать вопросы
                                </Button>
                            )}
                        </TabsContent>

                        <TabsContent value="upload" className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Выберите файл (.docx, .doc, .txt)</Label>
                                <div className="relative group">
                                    <Input
                                        type="file"
                                        accept=".docx,.doc,.txt"
                                        onChange={handleFileUpload}
                                        disabled={isProcessing}
                                        className="cursor-pointer file:cursor-pointer file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:border-blue-300 transition-colors h-11"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 shadow-sm">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">Найти правильные ответы через AI</div>
                                        <div className="text-xs text-muted-foreground">Включите для автоматического анализа текста</div>
                                    </div>
                                </div>
                                <Switch
                                    checked={autoFindCorrect}
                                    onCheckedChange={setAutoFindCorrect}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>

                            {isProcessing && (
                                <div className="space-y-3 p-4 border rounded-xl bg-muted/30">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            {statusMessage || "Анализ файла..."}
                                        </div>
                                        <span className="text-muted-foreground font-mono">{Math.round(processProgress)}%</span>
                                    </div>
                                    <Progress value={processProgress} className="h-2 bg-blue-100 dark:bg-blue-900/20" />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {parsedQuestions.length > 0 && (
                <Card className="shadow-sm border-t-4 border-t-green-500 overflow-hidden">
                    <CardHeader className="bg-muted/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl">Предпросмотр</CardTitle>
                                <CardDescription>Распознано {parsedQuestions.length} вопросов</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive"
                                onClick={() => setParsedQuestions([])}
                            >
                                Очистить всё
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px] border-t">
                            <div className="divide-y">
                                {parsedQuestions.map((q, i) => (
                                    <div key={q.id} className="p-6 hover:bg-muted/5 transition-colors group">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{i + 1}</span>
                                                    <div className="font-semibold text-sm leading-tight">{q.text}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                                    onClick={() => handleFindCorrectAnswer(q.id)}
                                                    disabled={isProcessing}
                                                    title="Найти правильный ответ через AI"
                                                >
                                                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                    onClick={() => removeQuestion(q.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.variants.map((v, idx) => (
                                                <li
                                                    key={idx}
                                                    className={`text-sm px-3 py-2 rounded-lg border transition-all ${idx === q.correctVariantIndex
                                                        ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 font-medium scale-[1.01]"
                                                        : "border-transparent text-muted-foreground bg-muted/30"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate">{v}</span>
                                                        {idx === q.correctVariantIndex && (
                                                            <div className="flex items-center gap-1 shrink-0 bg-green-200/50 dark:bg-green-800/50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                                                Верный
                                                            </div>
                                                        )}
                                                    </div>
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

            <div className="flex items-center justify-end gap-4 pb-12">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Отмена
                </Button>
                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={parsedQuestions.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 px-10 shadow-lg shadow-blue-500/20"
                >
                    Сохранить тест
                </Button>
            </div>
        </div>
    );
}