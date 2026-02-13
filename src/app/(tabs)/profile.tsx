import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useBottomTabSpacing } from "../../hooks/useBottomTabSpacing";
import { useAuthStore } from "../../store/authStore";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const bottomSpacing = useBottomTabSpacing();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingBottom: bottomSpacing }}>
        <View style={styles.userInfo}>
          <Text style={styles.title}>{t("profile:title", "Profile")}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.name}>
            {user?.user_metadata?.name ||
              t("profile:anonymous", "Anonymous User")}
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>
            {t("profile:signOut", "Sign Out")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    color: "#333",
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
