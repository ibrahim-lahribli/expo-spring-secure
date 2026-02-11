import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthGuard } from "../components/AuthGuard";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const { user, signOut } = useAuthStore();

  return (
    <AuthGuard>
      <View style={styles.container}>
        <Text style={styles.title}>
          Welcome, {user?.user_metadata?.name || user?.email}!
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
