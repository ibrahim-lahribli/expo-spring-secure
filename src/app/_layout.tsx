import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false, title: "Login" }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{ headerShown: false, title: "Sign Up" }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
