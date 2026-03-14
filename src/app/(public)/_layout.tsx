import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { AppHeaderBrand } from "../../components/navigation/AppHeaderBrand";
import { AppHeaderBackToHistory } from "../../components/navigation/AppHeaderBackToHistory";
import { AppHeaderRight } from "../../components/navigation/AppHeaderRight";
import { appColors, appRadius, appSpacing } from "../../theme/designSystem";

type TabIconName = React.ComponentProps<typeof Ionicons>["name"];

function TabBarIconWithLabel({
  color,
  icon,
  label,
}: {
  color: string;
  icon: TabIconName;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function PublicLayout() {
  const { t } = useTranslation("common");
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft: () => <AppHeaderBrand />,
        headerRight: () => <AppHeaderRight />,
        headerTitle: "",
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.tabInactive,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: appSpacing.xs,
        },
        tabBarStyle: {
          backgroundColor: appColors.surface,
          borderTopColor: appColors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: appSpacing.xs,
          paddingBottom: appSpacing.xs,
          paddingHorizontal: appSpacing.sm,
          borderTopLeftRadius: appRadius.lg,
          borderTopRightRadius: appRadius.lg,
        },
        headerStyle: { backgroundColor: appColors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { color: appColors.textPrimary, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t("navigation.home"),
          tabBarIcon: ({ color }) => (
            <TabBarIconWithLabel color={color} icon="home-outline" label={t("navigation.home")} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculate"
        options={{
          title: t("navigation.calculate"),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIconWithLabel color={color} icon="calculator-outline" label={t("navigation.calculate")} />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t("navigation.history"),
          tabBarIcon: ({ color }) => (
            <TabBarIconWithLabel color={color} icon="time-outline" label={t("navigation.history")} />
          ),
        }}
      />
      <Tabs.Screen
        name="zakat-explanations/index"
        options={{
          title: t("navigation.learn"),
          tabBarIcon: ({ color }) => (
            <TabBarIconWithLabel color={color} icon="book-outline" label={t("navigation.learn")} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t("navigation.settings"),
          tabBarIcon: ({ color }) => (
            <TabBarIconWithLabel color={color} icon="settings-outline" label={t("navigation.settings")} />
          ),
        }}
      />
      <Tabs.Screen
        name="zakat-explanations/[slug]"
        options={{
          title: t("navigation.learnZakat"),
          href: null,
          headerShown: true,
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: t("navigation.learnZakat"),
        }}
      />
      <Tabs.Screen
        name="history/[id]"
        options={{
          title: t("navigation.historyDetails"),
          href: null,
          headerShown: true,
          headerTitle: t("navigation.historyDetails"),
          headerLeft: () => <AppHeaderBackToHistory />,
          headerRight: () => <AppHeaderRight />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
