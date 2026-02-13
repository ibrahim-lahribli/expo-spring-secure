import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Only redirect if we're in an authenticated route and not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(public)" />;
  }

  // Redirect authenticated users to tabs
  return <Redirect href="/(tabs)/home" />;
}
