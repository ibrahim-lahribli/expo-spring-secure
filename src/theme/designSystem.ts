import { MD3LightTheme, type MD3Theme } from "react-native-paper";
import type { TextStyle, ViewStyle } from "react-native";

export const appColors = {
  primary: "#0F766E",
  primaryPressed: "#0D645E",
  accent: "#C8A54A",
  accentSoft: "#F7F1E2",
  background: "#F6FBF9",
  surface: "#FFFFFF",
  textPrimary: "#11242B",
  textSecondary: "#5E6F6A",
  border: "#D9DED8",
  error: "#B42318",
  success: "#1E7A46",
  tabInactive: "#81908C",
};

export const appSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const appRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const appTypography = {
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: appColors.textPrimary,
  } satisfies TextStyle,
  section: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: appColors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: appColors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: appColors.textSecondary,
  } satisfies TextStyle,
  button: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  } satisfies TextStyle,
};

export const minTouchHeight = 48;

export const appShadows = {
  card: {
    shadowColor: "#081118",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: appColors.primary,
    secondary: appColors.accent,
    error: appColors.error,
    background: appColors.background,
    surface: appColors.surface,
    onSurface: appColors.textPrimary,
    onBackground: appColors.textPrimary,
    outline: appColors.border,
  },
};

