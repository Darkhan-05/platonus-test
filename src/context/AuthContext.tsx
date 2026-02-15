import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '@/types'; // Убедись, что User включает { id, username, favorites: string[] }

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (token: string, username: string) => Promise<void>;
  toggleFavorite: (questionId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ПРОВЕРКА СЕССИИ ПРИ ЗАГРУЗКЕ
  // При F5 мы спрашиваем сервер: "У этого браузера есть валидные куки?"
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // <--- ВАЖНО: Отправляет куки на сервер
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data); // Сервер вернул юзера
        } else {
          setUser(null); // Куки протухли или их нет
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 2. РЕГИСТРАЦИЯ ПО ТОКЕНУ
  const register = async (token: string, username: string) => {
    const response = await fetch(`${API_URL}/auth/register-by-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, username }),
      credentials: 'include', // <--- ВАЖНО: Чтобы браузер принял Set-Cookie от сервера
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка регистрации');
    }

    const data = await response.json();
    setUser(data); // Обновляем стейт сразу
  };

  // 3. ИЗБРАННОЕ (ТЕПЕРЬ ЧЕРЕЗ БЭКЕНД)
  const toggleFavorite = async (questionId: string) => {
    if (!user) return;

    // Оптимистичное обновление UI (сразу меняем стейт, чтобы было быстро)
    const isFavorite = user.favorites.includes(questionId);
    const updatedFavorites = isFavorite
      ? user.favorites.filter(id => id !== questionId)
      : [...user.favorites, questionId];

    setUser({ ...user, favorites: updatedFavorites });

    try {
      // Отправляем запрос на сервер
      await fetch(`${API_URL}/users/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
        credentials: 'include', // Используем куки для авторизации
      });
    } catch (error) {
      console.error("Failed to sync favorites", error);
      // Если ошибка — откатываем стейт назад (можно добавить уведомление)
    }
  };

  // 4. ВЫХОД (Удаление кук)
  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    // localStorage чистить не надо, там ничего нет :)
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, register, toggleFavorite, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};