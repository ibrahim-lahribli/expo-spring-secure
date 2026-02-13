import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useBottomTabSpacing } from "../../hooks/useBottomTabSpacing";
import { useAuthStore } from "../../store/authStore";

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const bottomSpacing = useBottomTabSpacing();

  const { t } = useTranslation(["home", "common"]);

  return (
    <View style={styles.container}>
      <View style={[styles.contentWrapper, { paddingBottom: bottomSpacing }]}>
        <Text style={styles.title}>
          {t("home:welcomeMessage", {
            name: user?.user_metadata?.name || user?.email,
          })}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <LanguageSwitcher style={styles.languageSwitcher} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          <Text style={styles.logoutButtonText}>{t("home:signOut")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 20, // Base padding, tab bar spacing handled by content wrapper
  },
  contentWrapper: {
    paddingBottom: 90, // Extra padding to account for floating tab bar
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
  languageSwitcher: {
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
