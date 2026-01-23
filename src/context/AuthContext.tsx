import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type Role } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string) => boolean; // returns success
  register: (name: string, email: string, role?: Role) => boolean; // returns success
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

  const login = (email: string) => {
    const usersStr = localStorage.getItem('platonus_users');
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];

    let foundUser = users.find(u => u.email === email);

    if (!foundUser) {
       return false;
    }

    setUser(foundUser);
    localStorage.setItem('platonus_current_user', JSON.stringify(foundUser));
    return true;
  };

  const register = (name: string, email: string, role: Role = 'user') => {
    const usersStr = localStorage.getItem('platonus_users');
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.email === email)) {
        return false;
    }

    const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        favorites: []
    };

    users.push(newUser);
    localStorage.setItem('platonus_users', JSON.stringify(users));

    // Auto login
    setUser(newUser);
    localStorage.setItem('platonus_current_user', JSON.stringify(newUser));
    return true;
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
