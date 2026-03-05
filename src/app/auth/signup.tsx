import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SignupFormData, signupSchema } from "../../lib/auth";
import { useAuthStore } from "../../store/authStore";
import { appColors } from "../../theme/designSystem";

export default function SignupScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { t } = useTranslation(["common", "auth"]);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const isCompact = width < 380;
  const isWide = width >= 768;

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
      return;
    }

    Alert.alert(t("success"), t("auth:signupSuccess"), [
      {
        text: t("ok"),
        onPress: () => router.replace("/auth/login" as any),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isWide ? styles.contentWide : null,
          isCompact ? styles.contentCompact : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.shell, isWide ? styles.shellWide : null]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t("common:back")}
            >
              <Ionicons name="arrow-back" size={20} color={appColors.primary} />
            </Pressable>
            <Text style={styles.topBarTitle}>{t("auth:createAccount")}</Text>
          </View>

          <View style={[styles.hero, isWide ? styles.heroWide : null, isCompact ? styles.heroCompact : null]}>
            <Text style={[styles.heading, isCompact ? styles.headingCompact : null]}>
              {t("auth:signupScreen.heading")}
            </Text>
            <Text style={[styles.subheading, isWide ? styles.subheadingWide : null]}>
              {t("auth:signupScreen.subheading")}
            </Text>
          </View>

          <View style={[styles.formCard, isWide ? styles.formCardWide : null, isCompact ? styles.formCardCompact : null]}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>{t("auth:signupScreen.nameLabel")}</Text>
                  <TextInput
                    placeholder={t("auth:signupScreen.namePlaceholder")}
                    autoComplete="name"
                    textContentType="name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, isCompact ? styles.inputCompact : null, errors.name ? styles.errorInput : null]}
                    placeholderTextColor="#6E8A86"
                  />
                  {errors.name?.message ? <Text style={styles.fieldError}>{errors.name.message}</Text> : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>{t("auth:signupScreen.emailLabel")}</Text>
                  <TextInput
                    placeholder={t("auth:signupScreen.emailPlaceholder")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, isCompact ? styles.inputCompact : null, errors.email ? styles.errorInput : null]}
                    placeholderTextColor="#6E8A86"
                  />
                  {errors.email?.message ? <Text style={styles.fieldError}>{errors.email.message}</Text> : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>{t("auth:password")}</Text>
                  <View
                    style={[
                      styles.passwordInputWrap,
                      isCompact ? styles.passwordInputWrapCompact : null,
                      errors.password ? styles.errorInput : null,
                    ]}
                  >
                    <TextInput
                      placeholder="........"
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.passwordInput, isCompact ? styles.passwordInputCompact : null]}
                      placeholderTextColor="#6E8A86"
                    />
                    <Pressable onPress={() => setShowPassword((prev) => !prev)} style={({ pressed }) => [styles.eyeToggle, pressed && styles.pressed]}>
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#7A8A87" />
                    </Pressable>
                  </View>
                  {errors.password?.message ? (
                    <View style={styles.helperRow}>
                      <Ionicons name="alert-circle-outline" size={13} color={appColors.error} />
                      <Text style={styles.fieldError}>{errors.password.message}</Text>
                    </View>
                  ) : (
                    <View style={styles.helperRow}>
                      <Ionicons name="information-circle-outline" size={13} color="#7E8B88" />
                      <Text style={styles.helperText}>{t("auth:signupScreen.passwordHint")}</Text>
                    </View>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>{t("auth:confirmPassword")}</Text>
                  <View
                    style={[
                      styles.passwordInputWrap,
                      isCompact ? styles.passwordInputWrapCompact : null,
                      errors.confirmPassword ? styles.errorInput : null,
                    ]}
                  >
                    <TextInput
                      placeholder="........"
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.passwordInput, isCompact ? styles.passwordInputCompact : null]}
                      placeholderTextColor="#6E8A86"
                    />
                    <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} style={({ pressed }) => [styles.eyeToggle, pressed && styles.pressed]}>
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={18}
                        color={errors.confirmPassword ? appColors.error : "#7A8A87"}
                      />
                    </Pressable>
                  </View>
                  {errors.confirmPassword?.message ? (
                    <View style={styles.helperRow}>
                      <Ionicons name="alert-circle-outline" size={13} color={appColors.error} />
                      <Text style={styles.fieldError}>{t("common:validation.passwordMatch")}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            />

            <Pressable
              onPress={handleSubmit(onSignup)}
              disabled={isLoading}
              testID="signup-button"
              style={({ pressed }) => [
                styles.signupButton,
                isCompact ? styles.signupButtonCompact : null,
                isWide ? styles.signupButtonWide : null,
                (pressed || isLoading) && styles.signupButtonPressed,
                isLoading && styles.disabled,
              ]}
            >
              <Text style={[styles.signupButtonText, isCompact ? styles.signupButtonTextCompact : null]}>
                {isLoading ? t("common:loading") : t("auth:createAccount")}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/auth/login" as any)} style={({ pressed }) => [styles.loginLinkWrap, pressed && styles.pressed]}>
              <Text style={styles.loginPrompt}>{t("auth:alreadyHaveAccount")}</Text>
              <Text style={styles.loginLink}>{t("auth:login")}</Text>
            </Pressable>
          </View>

          <Text style={[styles.privacyText, isWide ? styles.privacyTextWide : null]}>
            {t("auth:signupScreen.privacyNote")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ECEEEE",
  },
  content: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contentCompact: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  contentWide: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  shell: {
    width: "100%",
    maxWidth: 390,
    minHeight: "100%",
    borderRadius: 2,
    backgroundColor: "#E8ECED",
    overflow: "hidden",
    paddingBottom: 18,
  },
  shellWide: {
    maxWidth: 480,
    minHeight: "auto",
    borderRadius: 20,
    shadowColor: "#102725",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 6,
  },
  topBar: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#D9DEDD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#E8ECED",
  },
  backButton: {
    position: "absolute",
    left: 14,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    color: "#1B615C",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: "#E8ECED",
    alignItems: "center",
  },
  heroCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  heroWide: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 14,
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "700",
    color: "#124E4A",
  },
  headingCompact: {
    fontSize: 34,
    lineHeight: 38,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    color: "#5B6F6B",
    textAlign: "center",
    maxWidth: 340,
  },
  subheadingWide: {
    maxWidth: 400,
  },
  formCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#D7DEDC",
    borderRadius: 8,
    padding: 14,
    gap: 14,
  },
  formCardCompact: {
    marginHorizontal: 16,
  },
  formCardWide: {
    marginHorizontal: 24,
    marginTop: 10,
    padding: 20,
  },
  inputWrap: {
    gap: 7,
  },
  label: {
    color: "#2A3A38",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D6DDDB",
    borderRadius: 6,
    backgroundColor: "#E7ECEB",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#2A3D3A",
  },
  inputCompact: {
    fontSize: 15,
  },
  passwordInputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D6DDDB",
    borderRadius: 6,
    backgroundColor: "#E7ECEB",
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInputWrapCompact: {
    minHeight: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#2A3D3A",
    paddingVertical: 8,
  },
  passwordInputCompact: {
    fontSize: 15,
  },
  eyeToggle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  errorInput: {
    borderColor: "#EA6760",
    backgroundColor: "#FFF7F7",
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  helperText: {
    color: "#6F7D79",
    fontSize: 13,
    lineHeight: 17,
  },
  fieldError: {
    color: appColors.error,
    fontSize: 13,
    lineHeight: 17,
  },
  signupButton: {
    marginTop: 6,
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0C3532",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  signupButtonCompact: {
    minHeight: 52,
  },
  signupButtonWide: {
    marginTop: 10,
  },
  signupButtonPressed: {
    backgroundColor: "#0D655E",
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  signupButtonTextCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  loginLinkWrap: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  loginPrompt: {
    color: appColors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  loginLink: {
    color: appColors.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  privacyText: {
    marginTop: 16,
    paddingHorizontal: 28,
    textAlign: "center",
    color: "#7F8E8B",
    fontSize: 14,
    lineHeight: 20,
  },
  privacyTextWide: {
    paddingHorizontal: 40,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.75,
  },
});
