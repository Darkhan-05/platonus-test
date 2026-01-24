import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string) => boolean; // returns success
  register: (name: string) => void; // returns generated username or null on failure
  logout: () => void;
  toggleFavorite: (questionId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('platonus_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string) => {
    const usersStr = localStorage.getItem('platonus_users');
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];

    let foundUser = users.find(u => u.username === username);

    if (!foundUser) {
      return false;
    }

    setUser(foundUser);
    localStorage.setItem('platonus_current_user', JSON.stringify(foundUser));
    return true;
  };

  const register = (name: string) => {
    const usersStr = localStorage.getItem('platonus_users');
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];

    // Generate unique username
    let username = "";
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      username = `${name.replace(/\s+/g, '')}#${randomNum}`;
      if (!users.find(u => u.username === username)) {
        isUnique = true;
      }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      username,
      favorites: []
    };

    users.push(newUser);
    localStorage.setItem('platonus_users', JSON.stringify(users));

    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('platonus_current_user');
  };

  const toggleFavorite = (questionId: string) => {
    if (!user) return;

    const updatedFavorites = user.favorites.includes(questionId)
      ? user.favorites.filter(id => id !== questionId)
      : [...user.favorites, questionId];

    const updatedUser = { ...user, favorites: updatedFavorites };
    setUser(updatedUser);
    localStorage.setItem('platonus_current_user', JSON.stringify(updatedUser));

    // Update in "DB" too
    const usersStr = localStorage.getItem('platonus_users');
    if (usersStr) {
      let users: User[] = JSON.parse(usersStr);
      users = users.map(u => u.id === user.id ? updatedUser : u);
      localStorage.setItem('platonus_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, toggleFavorite }}>
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
