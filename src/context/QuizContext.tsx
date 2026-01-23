import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Quiz, type Attempt } from '@/types';

interface QuizContextType {
  quizzes: Quiz[];
  attempts: Attempt[];
  addQuiz: (quiz: Quiz) => void;
  deleteQuiz: (id: string) => void;
  addAttempt: (attempt: Attempt) => void;
  getQuiz: (id: string) => Quiz | undefined;
  getAttemptsForUser: (userId: string) => Attempt[];
  getAttemptsForQuiz: (quizId: string) => Attempt[];
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: React.ReactNode }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    const storedQuizzes = localStorage.getItem('platonus_quizzes');
    if (storedQuizzes) {
      setQuizzes(JSON.parse(storedQuizzes));
    }
    const storedAttempts = localStorage.getItem('platonus_attempts');
    if (storedAttempts) {
      setAttempts(JSON.parse(storedAttempts));
    }
  }, []);

  const addQuiz = (quiz: Quiz) => {
    const updatedQuizzes = [...quizzes, quiz];
    setQuizzes(updatedQuizzes);
    localStorage.setItem('platonus_quizzes', JSON.stringify(updatedQuizzes));
  };

  const deleteQuiz = (id: string) => {
    const updatedQuizzes = quizzes.filter(q => q.id !== id);
    setQuizzes(updatedQuizzes);
    localStorage.setItem('platonus_quizzes', JSON.stringify(updatedQuizzes));
  };

  const addAttempt = (attempt: Attempt) => {
    const updatedAttempts = [...attempts, attempt];
    setAttempts(updatedAttempts);
    localStorage.setItem('platonus_attempts', JSON.stringify(updatedAttempts));

    // Update quiz stats (timesSolved)
    const updatedQuizzes = quizzes.map(q => {
        if (q.id === attempt.quizId) {
            return { ...q, timesSolved: (q.timesSolved || 0) + 1 };
        }
        return q;
    });
    setQuizzes(updatedQuizzes);
    localStorage.setItem('platonus_quizzes', JSON.stringify(updatedQuizzes));
  };

  const getQuiz = (id: string) => {
      return quizzes.find(q => q.id === id);
  };

  const getAttemptsForUser = (userId: string) => {
      return attempts.filter(a => a.userId === userId);
  };

  const getAttemptsForQuiz = (quizId: string) => {
      return attempts.filter(a => a.quizId === quizId);
  };

  return (
    <QuizContext.Provider value={{
        quizzes,
        attempts,
        addQuiz,
        deleteQuiz,
        addAttempt,
        getQuiz,
        getAttemptsForUser,
        getAttemptsForQuiz
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
