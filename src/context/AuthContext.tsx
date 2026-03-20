"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: (userData.role as any) || 'client'
            });
          } else {
            const newUser: User = {
               id: firebaseUser.uid,
               name: firebaseUser.displayName || 'Novo Usuário',
               email: firebaseUser.email || '',
               role: 'client'
            };
            await setDoc(userDocRef, {
                name: newUser.name,
                email: newUser.email,
                role: 'client',
                createdAt: new Date().toISOString()
            });
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateProfile = async (patch: Partial<User>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.id);
      await setDoc(userDocRef, patch, { merge: true });
      setUser({ ...user, ...patch });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};