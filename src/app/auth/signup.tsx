import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SignupFormData, signupSchema } from "../../lib/auth";
import { useAuthStore } from "../../store/authStore";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { t } = useTranslation(['common', 'auth']);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSignup = async (data: SignupFormData) => {
    const { error } = await signUp(data.email, data.password, data.name);

    if (error) {
      let errorMessage = t("auth:signupFailed");

      // Specific Supabase error messages
      if (error.message?.includes("User already registered")) {
        errorMessage = t("auth:userAlreadyExists");
      } else if (error.message?.includes("Password should be")) {
        errorMessage = t("auth:passwordRequirements");
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = t("auth:invalidEmail");
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(t("error"), errorMessage);
    } else {
      Alert.alert(t("success"), t("auth:signupSuccess"), [
        {
          text: t("ok"),
          onPress: () => router.replace("/auth/login" as any),
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth:createYourAccount")}</Text>
      <Text style={styles.subtitle}>{t("auth:signup")}</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder={t("auth:name")}
              autoComplete="name"
              textContentType="name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t("auth:email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder={t("auth:password")}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.confirmPassword && styles.inputError,
              ]}
              placeholder={t("auth:confirmPassword")}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit(onSignup)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth:signup")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/auth/login" as any)}
      >
        <Text style={styles.linkText}>
          {t("auth:alreadyHaveAccount")}{" "}
          <Text style={styles.linkTextBold}>{t("auth:login")}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  linkTextBold: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
