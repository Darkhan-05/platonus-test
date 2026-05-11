"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";

// --- Типы данных (совпадают с твоей Prisma схемой) ---
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
    user?: User; // Связь, чтобы видеть, кто использовал
}

export default function AdminPage() {
    const { t } = useLanguage();
    // --- Состояния ---
    const [users, setUsers] = useState<User[]>([]);
    const [tokens, setTokens] = useState<InviteToken[]>([]);

    // URL твоего бэкенда
    const API_URL = import.meta.env.VITE_BACKEND_URL || "";

    // --- Загрузка данных ---
    const fetchData = async () => {
        try {
            const usersRes = await fetch(`${API_URL}/admin/users`);
            const tokensRes = await fetch(`${API_URL}/admin/invites`);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (tokensRes.ok) setTokens(await tokensRes.json());
        } catch (error) {
            console.error(t('errorFileRead'), error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    // --- Создание токена ---
    const generateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/generate-invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expiresInDays: 7 }),
            });

            if (res.ok) {
                alert(t('tokenCreated'));
                fetchData(); // Обновляем списки
            }
        } catch (error) {
            alert(t('errorGeneratingToken'));
        }
    };

    const handleDelete = async (type: 'users' | 'invites', id: string) => {
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const res = await fetch(`${API_URL}/admin/${type}/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // Если удаление прошло успешно, обновляем данные
                fetchData();
            } else {
                alert(t('errorDeleting'));
            }
        } catch (error) {
            console.error(t('error'), error);
        }
    };

    // Подсчет статистики
    const totalUsers = users.length;
    const usedTokens = tokens.filter(t => t.isUsed).length;
    const activeTokens = tokens.length - usedTokens;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {t('adminDashboard')}
                    </h1>
                    <button
                        onClick={generateToken}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition transform hover:scale-105"
                    >
                        + {t('generateToken')}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title={t('totalUsers')} value={totalUsers} icon="👥" color="bg-blue-900/50 border-blue-800" />
                    <Card title={t('usedTokens')} value={usedTokens} icon="✅" color="bg-green-900/50 border-green-800" />
                    <Card title={t('freeTokens')} value={activeTokens} icon="🎫" color="bg-purple-900/50 border-purple-800" />
                </div>

                {/* Секция: Токены */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-300">{t('latestTokens')}</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-800">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-900 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Token Code</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">{t('usedBy')}</th>
                                    <th className="px-6 py-3">Created / Expires</th>
                                    <th className="px-6 py-3">Link</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-gray-950">
                                {tokens.map((token) => (
                                    <tr key={token.id} className="hover:bg-gray-900/50 transition">
                                        <td className="px-6 py-4 font-mono text-white">{token.code}</td>
                                        <td className="px-6 py-4">
                                            {token.isUsed ? (
                                                <span className="px-2 py-1 rounded text-xs bg-red-900 text-red-200">{t('used')}</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-200">{t('active')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {token.user ? (
                                                <div className="flex flex-col">
                                                    <span className="text-white">{token.user.username}</span>
                                                    <span className="text-xs text-gray-500">{token.user.loginId}</span>
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            Exp: {format(new Date(token.expiresAt), "dd.MM.yyyy HH:mm")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!token.isUsed && (
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${token.id}`)}
                                                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                                                >
                                                    {t('copyLink')}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete('invites', token.id)}
                                                className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-900/20 transition"
                                                title={t('deleteToken')}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Секция: Пользователи (Статистика по времени) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-300">{t('usersTimeline')}</h2>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 max-h-96 overflow-y-auto">
                        {users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(user => (
                            <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                                        {user.username.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{user.username}</p>
                                        <p className="text-xs text-gray-500">ID: {user.loginId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">{t('registeredAt')}</p>
                                    <p className="text-sm text-gray-300">{format(new Date(user.createdAt), "dd MMM HH:mm")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete('users', user.id)}
                                        className="text-gray-500 hover:text-red-500 p-2 transition"
                                        title={t('deleteUser')}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Простой компонент карточки
function Card({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
    return (
        <div className={`p-6 rounded-xl border ${color} shadow-lg backdrop-blur-sm`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-4xl font-bold text-white mt-2">{value}</h3>
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}