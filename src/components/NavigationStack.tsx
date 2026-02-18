import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export function NavigationStack() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(public)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(protected)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, title: t('navigation.login') }}
      />
      <Stack.Screen
        name="auth/signup"
        options={{ headerShown: false, title: t('navigation.signup') }}
      />
    </Stack>
  );
}

export default NavigationStack;
