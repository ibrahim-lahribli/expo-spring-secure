import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation(['common']);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("common:welcome") || "Welcome"}</Text>
      <Text style={styles.subtitle}>Choose your path</Text>

      <TouchableOpacity 
        style={[styles.button, styles.loginButton]} 
        onPress={() => router.push("/auth/login")}
      >
        <Text style={styles.buttonText}>{t("common:login") || "Login"}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.signupButton]} 
        onPress={() => router.push("/auth/signup")}
      >
        <Text style={styles.buttonText}>{t("common:signup") || "Sign Up"}</Text>
      </TouchableOpacity>

      <LanguageSwitcher style={styles.languageSwitcher} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 48,
  },
  button: {
    width: "100%",
    maxWidth: 300,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF",
  },
  signupButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  languageSwitcher: {
    position: "absolute",
    top: 60,
    right: 20,
  },
});
