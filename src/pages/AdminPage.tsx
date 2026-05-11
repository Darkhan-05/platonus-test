"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
    Users,
    Ticket,
    Trash2,
    Copy,
    CheckCircle,
    PlusCircle,
    Search,
    ArrowUpRight,
    UserPlus,
    Activity,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Типы данных ---
interface User {
    id: string;
    username: string;
    loginId: string;
    deviceId: string;
    createdAt: string;
    inviteTokenId: string;
}

interface InviteToken {
    id: string;
    code: string;
    isUsed: boolean;
    expiresAt: string;
    createdBy: string;
    user?: User;
}

export default function AdminPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [tokens, setTokens] = useState<InviteToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const API_URL = import.meta.env.VITE_BACKEND_URL || "";

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const usersRes = await fetch(`${API_URL}/admin/users`);
            const tokensRes = await fetch(`${API_URL}/admin/invites`);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (tokensRes.ok) setTokens(await tokensRes.json());
        } catch (error) {
            console.error(t('errorFileRead'), error);
            toast({
                title: t('error'),
                description: t('errorFileRead'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/generate-invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expiresInDays: 7 }),
            });
            if (res.ok) {
                toast({ title: t('tokenCreated'), description: "New access key has been generated." });
                fetchData();
            }
        } catch (error) {
            toast({ title: t('errorGeneratingToken'), variant: "destructive" });
        }
    };

    const handleDelete = async (type: 'users' | 'invites', id: string) => {
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const res = await fetch(`${API_URL}/admin/${type}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: t('success'), description: "Record deleted successfully." });
                fetchData();
            } else {
                toast({ title: t('errorDeleting'), variant: "destructive" });
            }
        } catch (error) {
            toast({ title: t('errorDeleting'), variant: "destructive" });
        }
    };

    const copyToClipboard = (tokenId: string) => {
        const link = `https://platonus-test.vercel.app/register/${tokenId}`;
        navigator.clipboard.writeText(link);
        toast({
            title: t('success'),
            description: t('copied'),
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-blue-500 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold tracking-tight">{t('authChecking')}</h2>
                    <p className="text-sm text-muted-foreground">Accessing secure admin terminal...</p>
                </div>
            </div>
        );
    }

    const filteredTokens = tokens.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">

                {/* Top Navigation / Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">{t('adminDashboard')}</h1>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                System Online • Secure Session
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search tokens..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-950/50 border-slate-800 rounded-xl focus:ring-blue-500/20"
                            />
                        </div>
                        <Button onClick={handleCreateToken} className="bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold h-10">
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('generateToken')}
                        </Button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title={t('totalUsers')}
                        value={users.length}
                        icon={<Users className="h-5 w-5" />}
                        trend="+12% this week"
                        color="text-blue-400"
                        bg="bg-blue-400/10"
                    />
                    <StatCard
                        title={t('usedTokens')}
                        value={tokens.filter(t => t.isUsed).length}
                        icon={<CheckCircle className="h-5 w-5" />}
                        trend="Active utilization"
                        color="text-green-400"
                        bg="bg-green-400/10"
                    />
                    <StatCard
                        title={t('freeTokens')}
                        value={tokens.filter(t => !t.isUsed).length}
                        icon={<Ticket className="h-5 w-5" />}
                        trend="Available keys"
                        color="text-purple-400"
                        bg="bg-purple-400/10"
                    />
                    <StatCard
                        title="System Uptime"
                        value="99.9%"
                        icon={<Activity className="h-5 w-5" />}
                        trend="Normal performance"
                        color="text-cyan-400"
                        bg="bg-cyan-400/10"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Tokens - Main Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
                                <div>
                                    <CardTitle className="text-xl text-white">{t('latestTokens')}</CardTitle>
                                    <CardDescription className="text-slate-500">Live feed of access tokens and their status</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={fetchData} className="text-slate-400 hover:text-white">
                                    <Activity className="h-4 w-4 mr-2" /> Refresh
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-950/30 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                            <tr>
                                                <th className="px-6 py-4">Token Identifier</th>
                                                <th className="px-6 py-4">State</th>
                                                <th className="px-6 py-4">Assigned To</th>
                                                <th className="px-6 py-4 text-right pr-8">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {filteredTokens.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">No matching tokens found in the mainframe.</td>
                                                </tr>
                                            ) : (
                                                filteredTokens.map((token) => (
                                                    <tr key={token.id} className="group hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-[10px]">
                                                            <div className="flex items-center text-white gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                                                {token.id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {token.isUsed ? (
                                                                <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400"></div>
                                                                    {t('used')}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                                    {t('active')}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {token.user ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                                        {token.user.username.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-medium">{token.user.username}</span>
                                                                        <span className="text-[10px] text-slate-500">#{token.user.loginId}</span>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-slate-600">—</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!token.isUsed && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => copyToClipboard(token.id)}
                                                                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete('invites', token.id)}
                                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar - Users & Logs */}
                    <div className="space-y-8">
                        {/* Recent Users List */}
                        <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-800/50">
                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-purple-400" />
                                    {t('usersTimeline')}
                                </CardTitle>
                                <CardDescription className="text-slate-500">Most recent registrations</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[450px]">
                                    <div className="divide-y divide-slate-800/50">
                                        {users.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 italic text-sm">No recent activity recorded.</div>
                                        ) : (
                                            recentUsers.map(user => (
                                                <div key={user.id} className="p-4 flex items-center justify-between group hover:bg-slate-800/20 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{user.username}</p>
                                                            <p className="text-[10px] text-slate-500">{format(new Date(user.createdAt), "MMM d, HH:mm")}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete('users', user.id)}
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 bg-slate-950/20 border-t border-slate-800/50">
                                    <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-white uppercase tracking-widest font-bold">
                                        View All Database <ArrowUpRight className="ml-2 h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Health / Status Component */}
                        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity className="h-20 w-20 text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Database Health</h3>
                                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                                    Optimal <CheckCircle className="h-6 w-6 text-emerald-500" />
                                </div>
                            </div>
                            <Separator className="bg-slate-800" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">API Latency</p>
                                    <p className="text-sm font-mono text-emerald-400">24ms</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Uptime</p>
                                    <p className="text-sm font-mono text-blue-400">14d 6h</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Custom StatCard Component for the Premium Look
function StatCard({ title, value, icon, trend, color, bg }: { title: string, value: string | number, icon: React.ReactNode, trend: string, color: string, bg: string }) {
    return (
        <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-3xl p-6 hover:translate-y-[-4px] transition-all cursor-default group shadow-lg">
            <div className="flex flex-col gap-4">
                <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    {icon}
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-800/50 flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    {trend}
                </p>
            </div>
        </Card>
    );
}