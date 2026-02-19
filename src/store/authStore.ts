import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      initializeAuth: async () => {
        try {
          // Get initial session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          set({
            user: session?.user || null,
            session: session || null,
            isAuthenticated: !!session,
            isLoading: false,
          });

          // Set up real-time state synchronization
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              user: session?.user || null,
              session: session || null,
              isAuthenticated: !!session,
              isLoading: false,
            });
          });
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error("Error signing out:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        // Custom storage that handles SSR correctly
        return {
          getItem: async (name: string) => {
            if (typeof window === "undefined") {
              return null;
            }

            try {
              if (typeof localStorage !== "undefined") {
                return localStorage.getItem(name);
              } else {
                return await AsyncStorage.getItem(name);
              }
            } catch (error) {
              console.error("Error getting item from storage:", error);
              return null;
            }
          },
          setItem: async (name: string, value: string) => {
            if (typeof window === "undefined") {
              return;
            }

            try {
              if (typeof localStorage !== "undefined") {
                localStorage.setItem(name, value);
              } else {
                await AsyncStorage.setItem(name, value);
              }
            } catch (error) {
              console.error("Error setting item in storage:", error);
            }
          },
          removeItem: async (name: string) => {
            if (typeof window === "undefined") {
              return;
            }

            try {
              if (typeof localStorage !== "undefined") {
                localStorage.removeItem(name);
              } else {
                await AsyncStorage.removeItem(name);
              }
            } catch (error) {
              console.error("Error removing item from storage:", error);
            }
          },
        };
      }),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
