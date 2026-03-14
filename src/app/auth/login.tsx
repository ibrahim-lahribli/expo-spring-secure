import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, I18nManager, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { getGuestHistoryEntries } from "../../features/history/storage";
import { LoginFormData, loginSchema } from "../../lib/auth";
import { useAuthStore } from "../../store/authStore";
import { appColors } from "../../theme/designSystem";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const { t } = useTranslation(["common", "auth"]);
  const [authErrorKey, setAuthErrorKey] = React.useState<string | null>(null);
  const [authErrorRaw, setAuthErrorRaw] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const isRTL = I18nManager.isRTL;
  const isCompact = width < 380;
  const isWide = width >= 768;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    setAuthErrorKey(null);
    setAuthErrorRaw(null);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      let nextErrorKey: string | null = "auth:loginFailed";
      let nextErrorRaw: string | null = null;
      if (error.message?.includes("Invalid login credentials")) {
        nextErrorKey = "auth:invalidCredentials";
      } else if (error.message?.includes("Email not confirmed")) {
        nextErrorKey = "auth:emailNotConfirmed";
      } else if (error.message?.includes("Too many requests")) {
        nextErrorKey = "auth:tooManyAttempts";
      } else if (error.message) {
        nextErrorKey = null;
        nextErrorRaw = error.message;
      }
      setAuthErrorKey(nextErrorKey);
      setAuthErrorRaw(nextErrorRaw);
      return;
    }

    const guestHistory = await getGuestHistoryEntries();
    if (guestHistory.length > 0) {
      Alert.alert(
        t("auth:loginScreen.importGuestHistoryTitle"),
        t("auth:loginScreen.importGuestHistoryBody"),
        [
          { text: t("auth:loginScreen.importGuestHistoryLater"), style: "cancel" },
          {
            text: t("auth:loginScreen.importGuestHistoryAction"),
            onPress: () =>
              Alert.alert(
                t("auth:loginScreen.importQueuedTitle"),
                t("auth:loginScreen.importQueuedBody"),
              ),
          },
        ],
      );
    }
    router.replace("/");
  };

  const passwordFooterError =
    (errors.password?.message ? t(String(errors.password.message) as never) : undefined) ??
    (authErrorKey || authErrorRaw ? t("auth:loginScreen.passwordHintError") : undefined);

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
              style={({ pressed }) => [
                styles.backButton,
                isRTL && styles.backButtonRtl,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("common:back")}
            >
              <Ionicons
                name={isRTL ? "arrow-forward" : "arrow-back"}
                size={20}
                color={appColors.primary}
              />
            </Pressable>
            <Text style={styles.topBarTitle}>{t("auth:login")}</Text>
          </View>

          <View style={[styles.hero, isWide ? styles.heroWide : null, isCompact ? styles.heroCompact : null]}>
            <Text style={[styles.heading, isCompact ? styles.headingCompact : null]}>
              {t("auth:loginScreen.heading")}
            </Text>
            <Text style={[styles.subheading, isWide ? styles.subheadingWide : null]}>
              {t("auth:loginScreen.subheading")}
            </Text>
          </View>

          <View style={[styles.formCard, isWide ? styles.formCardWide : null, isCompact ? styles.formCardCompact : null]}>
            {authErrorKey || authErrorRaw ? (
              <View style={[styles.authErrorCard, isRTL && styles.rowReverse]}>
                <Ionicons name="alert-circle-outline" size={16} color={appColors.error} />
                <Text style={styles.authErrorText}>
                  {authErrorKey ? t(authErrorKey as never) : authErrorRaw}
                </Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>{t("auth:loginScreen.emailLabel")}</Text>
                  <TextInput
                    placeholder={t("auth:email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      if (authErrorKey || authErrorRaw) {
                        setAuthErrorKey(null);
                        setAuthErrorRaw(null);
                      }
                      onChange(text);
                    }}
                    value={value}
                    style={[styles.input, isCompact ? styles.inputCompact : null, errors.email ? styles.errorInput : null]}
                    placeholderTextColor="#83918D"
                  />
                  {errors.email?.message ? (
                    <Text style={styles.fieldError}>{t(String(errors.email.message) as never)}</Text>
                  ) : null}
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
                      isRTL && styles.rowReverse,
                      isCompact ? styles.passwordInputWrapCompact : null,
                      errors.password || authErrorKey || authErrorRaw ? styles.errorInput : null,
                    ]}
                  >
                    <TextInput
                      placeholder={t("auth:password")}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        if (authErrorKey || authErrorRaw) {
                          setAuthErrorKey(null);
                          setAuthErrorRaw(null);
                        }
                        onChange(text);
                      }}
                      value={value}
                      style={[styles.passwordInput, isCompact ? styles.passwordInputCompact : null]}
                      placeholderTextColor="#83918D"
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={({ pressed }) => [styles.eyeToggle, pressed && styles.pressed]}
                    >
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#8A8D8A" />
                    </Pressable>
                  </View>
                  {passwordFooterError ? (
                    <View style={[styles.passwordErrorRow, isRTL && styles.rowReverse]}>
                      <Ionicons name="alert-circle-outline" size={13} color={appColors.error} />
                      <Text style={styles.fieldError}>{passwordFooterError}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  t("auth:forgotPassword"),
                  t("auth:loginScreen.forgotPasswordUnavailable"),
                )
              }
              style={({ pressed }) => [styles.forgotPassword, pressed && styles.pressed]}
            >
              <Text style={styles.forgotPasswordText}>{t("auth:forgotPassword")}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleSubmit(onLogin)}
            disabled={isLoading}
            testID="login-button"
            style={({ pressed }) => [
              styles.loginButton,
              isCompact ? styles.loginButtonCompact : null,
              isWide ? styles.loginButtonWide : null,
              (pressed || isLoading) && styles.loginButtonPressed,
              isLoading && styles.disabled,
            ]}
          >
            <Text style={[styles.loginButtonText, isCompact ? styles.loginButtonTextCompact : null]}>
              {isLoading ? t("common:loading") : t("auth:login")}
            </Text>
          </Pressable>

          <View style={[styles.signUpRow, isRTL && styles.rowReverse]}>
            <Text style={styles.signUpPrompt}>{t("auth:dontHaveAccount")} </Text>
            <Pressable onPress={() => router.push("/auth/signup" as any)} style={({ pressed }) => [pressed && styles.pressed]}>
              <Text style={styles.signUpLink}>{t("auth:signup")}</Text>
            </Pressable>
          </View>

          <View style={[styles.securityRow, isRTL && styles.rowReverse]}>
            <Ionicons name="lock-closed-outline" size={12} color="#90A29D" />
            <Text style={styles.securityText}>{t("auth:loginScreen.securityNote")}</Text>
          </View>
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
    backgroundColor: "#ECEEEE",
    overflow: "hidden",
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
  backButtonRtl: {
    left: undefined,
    right: 14,
  },
  topBarTitle: {
    color: "#1B615C",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 6,
    backgroundColor: "#E8ECED",
  },
  heroCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  heroWide: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    color: "#124E4A",
  },
  headingCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    color: "#5B6F6B",
    maxWidth: 360,
  },
  subheadingWide: {
    maxWidth: 420,
  },
  formCard: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#D7DEDC",
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  formCardCompact: {
    marginHorizontal: 16,
    padding: 14,
  },
  formCardWide: {
    marginHorizontal: 24,
    marginTop: 10,
    padding: 20,
  },
  authErrorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F2C6C2",
    backgroundColor: "#FDEDEC",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  authErrorText: {
    flex: 1,
    color: appColors.error,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 20,
    color: "#2A3D3A",
  },
  inputCompact: {
    fontSize: 18,
  },
  passwordInputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D6DDDB",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    paddingStart: 12,
    paddingEnd: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInputWrapCompact: {
    minHeight: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 20,
    color: "#2A3D3A",
    paddingVertical: 8,
  },
  passwordInputCompact: {
    fontSize: 18,
  },
  eyeToggle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  errorInput: {
    borderColor: "#EA6760",
  },
  fieldError: {
    color: appColors.error,
    fontSize: 12,
    lineHeight: 17,
  },
  passwordErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    color: appColors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  loginButton: {
    marginHorizontal: 20,
    marginTop: 14,
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
  loginButtonCompact: {
    marginHorizontal: 16,
  },
  loginButtonWide: {
    marginHorizontal: 24,
    marginTop: 18,
  },
  loginButtonPressed: {
    backgroundColor: "#0D655E",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
  },
  loginButtonTextCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  disabled: {
    opacity: 0.7,
  },
  signUpRow: {
    marginTop: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signUpPrompt: {
    color: "#4A5F5A",
    fontSize: 14,
  },
  signUpLink: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  securityRow: {
    borderTopWidth: 1,
    borderTopColor: "#D9DEDD",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#8FA19C",
  },
  pressed: {
    opacity: 0.75,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});
