import { I18nManager } from "react-native";
import { isRTL } from "../i18n/i18n";
import type { SupportedLanguage } from "../types/i18n";

/**
 * Get text alignment based on current language
 */
export const getTextAlign = (
  language: SupportedLanguage,
): "left" | "right" | "center" => {
  if (isRTL(language)) {
    return "right";
  }
  return "left";
};

/**
 * Get flex direction based on current language
 */
export const getFlexDirection = (
  language: SupportedLanguage,
): "row" | "row-reverse" => {
  if (isRTL(language)) {
    return "row-reverse";
  }
  return "row";
};

/**
 * Get margin/padding direction based on current language
 */
export const getMarginStart = (
  language: SupportedLanguage,
): "marginLeft" | "marginRight" => {
  if (isRTL(language)) {
    return "marginRight";
  }
  return "marginLeft";
};

export const getMarginEnd = (
  language: SupportedLanguage,
): "marginLeft" | "marginRight" => {
  if (isRTL(language)) {
    return "marginLeft";
  }
  return "marginRight";
};

export const getPaddingStart = (
  language: SupportedLanguage,
): "paddingLeft" | "paddingRight" => {
  if (isRTL(language)) {
    return "paddingRight";
  }
  return "paddingLeft";
};

export const getPaddingEnd = (
  language: SupportedLanguage,
): "paddingLeft" | "paddingRight" => {
  if (isRTL(language)) {
    return "paddingLeft";
  }
  return "paddingRight";
};

/**
 * Check if app is currently in RTL mode
 */
export const isAppInRTLMode = (): boolean => {
  return I18nManager.isRTL;
};

/**
 * Create RTL-aware styles
 */
export const createRTLStyles = (language: SupportedLanguage) => ({
  textAlign: getTextAlign(language),
  flexDirection: getFlexDirection(language),
  writingDirection: isRTL(language) ? "rtl" : ("ltr" as const),
});

/**
 * Helper for creating dynamic styles based on language
 */
export const createDynamicStyle = (
  language: SupportedLanguage,
  baseStyles: any,
  rtlStyles?: any,
  ltrStyles?: any,
) => {
  const dynamicStyles: any = { ...baseStyles };

  if (isRTL(language) && rtlStyles) {
    Object.assign(dynamicStyles, rtlStyles);
  } else if (!isRTL(language) && ltrStyles) {
    Object.assign(dynamicStyles, ltrStyles);
  }

  return dynamicStyles;
};
