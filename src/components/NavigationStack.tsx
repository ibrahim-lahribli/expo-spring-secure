import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export function NavigationStack() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, title: t('navigation.login') }}
      />
      <Stack.Screen
        name="auth/signup"
        options={{ headerShown: false, title: t('navigation.signup') }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: t('navigation.home'),
        }}
      />
    </Stack>
  );
}

export default NavigationStack;
