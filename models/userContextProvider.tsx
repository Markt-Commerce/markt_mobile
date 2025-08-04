// UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

type UserRole = 'buyer' | 'seller' | null;

interface User {
  id: string;
  name: string;
  email: string;
  // add more fields as needed
}

interface UserContextType {
  user: User | null;
  role: UserRole;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);

  return (
    <UserContext.Provider value={{ user, role, setUser, setRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
