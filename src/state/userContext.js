import React from "react";
import { db } from "../db/db";

const UserContext = React.createContext(null);

export function UserProvider({ children }) {
  const [userState, setUserState] = React.useState({
    currentLevel: 1,
    updatedAt: null
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserState = async () => {
      try {
        setIsLoading(true);
        const state = await db.getUserState();
        if (state) {
          setUserState({
            currentLevel: state.currentLevel,
            updatedAt: state.updatedAt
          });
        }
      } catch (error) {
        console.error("Ошибка при загрузке состояния пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserState();
  }, []);

  const userUtils = {
    updateCurrentLevel: async (newLevel) => {
      try {
        const newState = {
          currentLevel: newLevel,
          updatedAt: new Date()
        };
        
        await db.saveUserState(newState);
        setUserState(newState);
        return true;
      } catch (error) {
        console.error("Ошибка при обновлении уровня:", error);
        return false;
      }
    },

    nextLevel: async () => {
      const nextLevel = userState.currentLevel + 1;
      return await userUtils.updateCurrentLevel(nextLevel);
    },

    resetProgress: async () => {
      try {
        await db.deleteUserState();
        const initialState = {
          currentLevel: 1,
          updatedAt: new Date()
        };
        setUserState(initialState);
        return true;
      } catch (error) {
        console.error("Ошибка при сбросе прогресса:", error);
        return false;
      }
    },

    getProgress: () => ({
      currentLevel: userState.currentLevel,
      lastUpdated: userState.updatedAt
    }),
  };

  const contextValue = {
    userState,
    setUserState,
    isLoading,
    ...userUtils
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
