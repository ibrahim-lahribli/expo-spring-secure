import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { AppHeaderBrand } from "../../../components/navigation/AppHeaderBrand";
import { AppHeaderRight } from "../../../components/navigation/AppHeaderRight";
import { appColors } from "../../../theme/designSystem";

export default function CalculateLayout() {
  const { t } = useTranslation("common");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <AppHeaderBrand />,
        headerRight: () => <AppHeaderRight />,
        headerTitle: "",
        headerStyle: { backgroundColor: appColors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { color: appColors.textPrimary, fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("navigation.calculate") }} />
      <Stack.Screen name="result" options={{ title: t("navigation.quickResult") }} />
      <Stack.Screen
        name="detailed"
        options={{ title: t("navigation.detailedCalculator") }}
      />
      <Stack.Screen
        name="detailed/setup"
        options={{ title: t("navigation.detailedSetup") }}
      />
    </Stack>
  );
}
