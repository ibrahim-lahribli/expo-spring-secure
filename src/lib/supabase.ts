import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Custom storage adapter that handles SSR
const customStorage = {
  async getItem(key: string): Promise<string | null> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return null;
    }

    try {
      // Use localStorage for web, AsyncStorage for React Native
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error("Error getting item from storage:", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Use localStorage for web, AsyncStorage for React Native
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("Error setting item in storage:", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Use localStorage for web, AsyncStorage for React Native
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Error removing item from storage:", error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== "undefined",
    storage: customStorage,
  },
});
