import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Quiz, type Attempt, type Question } from '@/types';

interface QuizContextType {
  quizzes: Quiz[];
  attempts: Attempt[];
  addQuiz: (quiz: Quiz) => void;
  deleteQuiz: (id: string) => void;
  addAttempt: (attempt: Attempt) => void;
  getQuiz: (id: string) => Quiz | undefined;
  getAttemptsForUser: (userId: string) => Attempt[];
  getAttemptsForQuiz: (quizId: string) => Attempt[];
  createFavoritesQuiz: (favoriteIds: string[]) => Quiz | null;
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
    // Only update if it's a real quiz, not the favorites temp quiz
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
      // Check if it's the favorites quiz stored in session/mem or just generate on fly if requested?
      // Actually, for "Play" page to work, it expects getQuiz to return something.
      // If we create a temporary quiz, we might need to add it to state temporarily or handle it here.
      return quizzes.find(q => q.id === id);
  };

  const getAttemptsForUser = (userId: string) => {
      return attempts.filter(a => a.userId === userId);
  };

  const getAttemptsForQuiz = (quizId: string) => {
      return attempts.filter(a => a.quizId === quizId);
  };

  const createFavoritesQuiz = (favoriteIds: string[]) => {
      if (favoriteIds.length === 0) return null;

      const favoriteQuestions: Question[] = [];

      quizzes.forEach(quiz => {
          quiz.questions.forEach(q => {
              if (favoriteIds.includes(q.id)) {
                  // Avoid duplicates if multiple quizzes have same question ID (unlikely with UUID but possible)
                  if (!favoriteQuestions.find(fq => fq.id === q.id)) {
                      favoriteQuestions.push(q);
                  }
              }
          });
      });

      if (favoriteQuestions.length === 0) return null;

      const favQuiz: Quiz = {
          id: "favorites-quiz",
          title: "My Favorites",
          questions: favoriteQuestions,
          createdBy: "system",
          createdAt: new Date().toISOString(),
          timesSolved: 0
      };

      // Add to state temporarily so it can be found by ID
      // We check if it exists first to update it
      const existingIdx = quizzes.findIndex(q => q.id === "favorites-quiz");
      let newQuizzes = [...quizzes];
      if (existingIdx >= 0) {
          newQuizzes[existingIdx] = favQuiz;
      } else {
          newQuizzes.push(favQuiz);
      }
      setQuizzes(newQuizzes);

      // We don't save this to localStorage to keep it ephemeral session-based,
      // OR we save it so refresh works. Let's save it for simplicity.
      localStorage.setItem('platonus_quizzes', JSON.stringify(newQuizzes));

      return favQuiz;
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
        getAttemptsForQuiz,
        createFavoritesQuiz
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
