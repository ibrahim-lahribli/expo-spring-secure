import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { View } from "react-native";
import { PaperProvider } from "react-native-paper";
import i18n, { initializeI18n } from "../i18n/i18n";
import { useAuthStore } from "../store/authStore";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this to error, so we catch it */
});

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const { initializeAuth } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize app resources
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize i18n
        await initializeI18n();
        // Initialize Auth
        await initializeAuth();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initializeAuth]);

  // Hide splash screen when the root view has performed layout
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately!
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // We no longer return null here to ensure the Root Layout navigator is always mounted
  // Expo Router for web requires the navigator to be present on the first render

  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{ headerShown: false }}
              initialRouteName="(public)"
            >
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </View>
        </QueryClientProvider>
      </PaperProvider>
    </I18nextProvider>
  );
}
