
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  userType: 'client' | 'provider';
  firstName: string;
  lastName: string;
  county: string;
  organizationName?: string;
}

interface Provider {
  id: string;
  providerCode: string;
  gender: string;
  phoneNumber: string;
  subscriptionStatus: string;
  photoUrl: string;
}

interface UserContextType {
  user: User | null;
  provider: Provider | null;
  setUser: (user: User | null) => void;
  setProvider: (provider: Provider | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  const logout = () => {
    console.log('User logged out');
    setUser(null);
    setProvider(null);
  };

  return (
    <UserContext.Provider value={{ user, provider, setUser, setProvider, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
