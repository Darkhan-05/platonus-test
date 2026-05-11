import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
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
import { generateQuestionVariants, findCorrectAnswerIndex, findCorrectAnswersBatch } from "@/lib/gemini";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateQuizPage() {
    const { user } = useAuth();
    const { addQuiz, isGuestLimitReached } = useQuiz();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [title, setTitle] = useState("");
    const [rawText, setRawText] = useState("");
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoFindCorrect, setAutoFindCorrect] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    const isGuest = !user;
    const limitReached = isGuest && isGuestLimitReached();

    const parseTextContent = async (text: string) => {
        const rawParts = text.split("<question>");
        const parts = rawParts.filter(p => p.trim());
        const totalSteps = parts.length;
        let completedSteps = 0;

        const questions: (Question & { needsVariants: boolean; needsCorrectIndex: boolean })[] = parts.map((part, index) => {
            const variantParts = part.split("<variant>");
            const questionText = variantParts[0].trim();
            const variants = variantParts.slice(1).map(v => v.trim()).filter(v => v);

            return {
                id: crypto.randomUUID(),
                text: questionText,
                variants: variants,
                correctVariantIndex: 0,
                needsVariants: questionText !== "" && variants.length === 0,
                needsCorrectIndex: questionText !== "" && variants.length > 1 && autoFindCorrect
            };
        });

        const updateProgress = () => {
            completedSteps++;
            setProcessProgress((completedSteps / totalSteps) * 100);
            setStatusMessage(`${t('processing')}: ${completedSteps} ${t('outOf')} ${totalSteps}...`);
        };

        const questionsToGenerate = questions.filter(q => q.needsVariants);
        if (questionsToGenerate.length > 0) {
            const CONCURRENCY = 10;
            const queue = [...questionsToGenerate];
            await Promise.all(Array(Math.min(CONCURRENCY, queue.length)).fill(null).map(async () => {
                while (queue.length > 0) {
                    const q = queue.shift();
                    if (!q) continue;
                    try {
                        q.variants = await generateQuestionVariants(q.text);
                        q.needsCorrectIndex = q.variants.length > 1 && autoFindCorrect;
                    } catch (e) {
                        q.variants = ["Error"];
                    }
                    updateProgress();
                }
            }));
        }

        const questionsToFindCorrect = questions.filter(q => q.needsCorrectIndex);
        const BATCH_SIZE = 20;
        for (let i = 0; i < questionsToFindCorrect.length; i += BATCH_SIZE) {
            const batch = questionsToFindCorrect.slice(i, i + BATCH_SIZE);
            try {
                const indexes = await findCorrectAnswersBatch(batch.map(q => ({ text: q.text, variants: q.variants })));
                batch.forEach((q, idx) => {
                    q.correctVariantIndex = indexes[idx] ?? 0;
                    updateProgress();
                });
            } catch (e) {
                batch.forEach(() => updateProgress());
            }
        }

        questions.forEach(q => {
            if (!q.needsVariants && !q.needsCorrectIndex) updateProgress();
        });

        return questions.filter(q => q.text !== "");
    };

    const handleTextParse = async () => {
        if (!rawText.trim()) return;
        setIsProcessing(true);
        setProcessProgress(0);
        try {
            let questions = await parseTextContent(rawText);

            if (isGuest && questions.length > 300) {
                questions = questions.slice(0, 300);
                toast({
                    title: t('limitReached'),
                    description: t('guestLimitQuestions'),
                    variant: "destructive"
                });
            }

            if (questions.length > 0) {
                setParsedQuestions([...parsedQuestions, ...questions]);
                setRawText("");
                toast({
                    title: t('success'),
                    description: `${t('recognizeQuestions')}: ${questions.length}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: t('error'),
                    description: t('noQuestionsFound'),
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('errorParsing'),
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
        setStatusMessage(t('processing'));
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
                    title: t('errorUnsupportedFormat'),
                    description: ".docx, .doc, .txt",
                });
                setIsProcessing(false);
                return;
            }

            let questions = await parseTextContent(text);

            if (isGuest && questions.length > 300) {
                questions = questions.slice(0, 300);
            }

            if (questions.length > 0) {
                setParsedQuestions([...parsedQuestions, ...questions]);
                toast({
                    title: t('success'),
                    description: `${t('recognizeQuestions')}: ${questions.length}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: t('error'),
                    description: t('noQuestionsFound'),
                });
            }

        } catch (err) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('errorFileRead'),
            });
        }

        setIsProcessing(false);
        setStatusMessage("");
    };

    const handleSave = () => {
        try {
            const newQuiz: Quiz = {
                id: crypto.randomUUID(),
                title: title || (parsedQuestions.length > 0 ? parsedQuestions[0].text : t('createNewQuiz')),
                questions: parsedQuestions,
                createdBy: isGuest ? "guest" : (user?.id || "unknown"),
                createdAt: new Date().toISOString(),
                timesSolved: 0
            };

            addQuiz(newQuiz);
            toast({
                title: t('success'),
                description: t('saveQuiz'),
            });
            navigate("/dashboard");
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('errorSave'),
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
        setStatusMessage(t('processing'));
        try {
            const correctIndex = await findCorrectAnswerIndex(question.text, question.variants);
            setParsedQuestions(prev => prev.map(q =>
                q.id === questionId ? { ...q, correctVariantIndex: correctIndex } : q
            ));
            toast({
                title: t('success'),
                description: t('correct'),
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('errorAi'),
            });
        } finally {
            setIsProcessing(false);
            setStatusMessage("");
        }
    };

    return (
        <div className="container mx-auto max-w-4xl space-y-8 py-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('createNewQuiz')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('startCreating')}
                </p>
                {isGuest && (
                    <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle>{t('guestMode')}</AlertTitle>
                        <AlertDescription>
                            {t('guestLimitInfo')}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">{t('quizTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={t('quizTitle')}
                            className="bg-muted/30 focus-visible:ring-blue-500"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-blue-500">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        {t('createQuiz')}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                        Format: &lt;question&gt; ... &lt;variant&gt; ...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="manual">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="manual" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Keyboard className="h-4 w-4" /> {t('manualInput')}
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <FileText className="h-4 w-4" /> {t('fileUpload')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t('pasteText')}</Label>
                                <Textarea
                                    className="min-h-[180px] font-mono text-sm leading-relaxed bg-muted/20 border-dashed focus-visible:ring-blue-500"
                                    placeholder="<question>..."
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
                                        <div className="text-sm font-semibold">{t('autoFindAnswers')}</div>
                                        <div className="text-xs text-muted-foreground">{t('aiDescription')}</div>
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
                                            {statusMessage || t('processing')}
                                        </div>
                                        <span className="text-muted-foreground font-mono">{Math.round(processProgress)}%</span>
                                    </div>
                                    <Progress value={processProgress} className="h-2 bg-blue-100 dark:bg-blue-900/20" />
                                </div>
                            ) : (
                                <Button onClick={handleTextParse} disabled={isProcessing || !rawText.trim()} className="w-full bg-blue-600 hover:bg-blue-700 h-10 px-8 transition-all hover:scale-[1.02]">
                                    {t('recognizeQuestions')}
                                </Button>
                            )}
                        </TabsContent>

                        <TabsContent value="upload" className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t('fileUpload')}</Label>
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
                                        <div className="text-sm font-semibold">{t('autoFindAnswers')}</div>
                                        <div className="text-xs text-muted-foreground">{t('aiDescription')}</div>
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
                                            {statusMessage || t('processing')}
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
                                <CardTitle className="text-xl">{t('preview')}</CardTitle>
                                <CardDescription>{t('recognizeQuestions')} {parsedQuestions.length}</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive"
                                onClick={() => setParsedQuestions([])}
                            >
                                {t('clearAll')}
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
                                                                {t('correct')}
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
                    {t('cancel')}
                </Button>
                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={parsedQuestions.length === 0 || limitReached}
                    className="bg-blue-600 hover:bg-blue-700 px-10 shadow-lg shadow-blue-500/20"
                >
                    {limitReached ? t('limitReached') : t('saveQuiz')}
                </Button>
            </div>
        </div>
    );
}