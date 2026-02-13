import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  // If already logged in → go to app
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Welcome" }}
      />
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, title: "Login" }}
      />
      <Stack.Screen
        name="auth/signup"
        options={{ headerShown: false, title: "Signup" }}
      />
    </Stack>
  );
}

