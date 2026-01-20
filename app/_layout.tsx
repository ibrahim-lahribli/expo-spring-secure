import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";

const queryClient = new QueryClient();
export default function RootLayout() {
  <QueryClientProvider client={queryClient}>
    <PaperProvider>
      <Stack />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </PaperProvider>
  </QueryClientProvider>;
  return <Stack />;
}
