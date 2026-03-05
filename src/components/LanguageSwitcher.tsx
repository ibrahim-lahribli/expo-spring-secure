import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguageSwitcher } from "../i18n/i18n";
import type { LanguageSwitcherProps, SupportedLanguage } from "../types/i18n";

export function LanguageSwitcher({
  style,
  buttonStyle,
  textStyle,
}: LanguageSwitcherProps) {
  const { t } = useTranslation("common");
  const { currentLanguage, switchLanguage, supportedLanguages } =
    useLanguageSwitcher();

  const getLanguageLabel = (language: SupportedLanguage): string => {
    return t(`languages.${language}`);
  };

  return (
    <View style={[styles.container, style]}>
      {supportedLanguages.map((language) => (
        <TouchableOpacity
          key={language}
          testID={`language-button-${language}`}
          style={[
            styles.languageButton,
            currentLanguage === language && styles.activeButton,
            buttonStyle,
          ]}
          onPress={() => switchLanguage(language)}
        >
          <Text
            style={[
              styles.languageText,
              currentLanguage === language && styles.activeText,
              textStyle,
            ]}
          >
            {getLanguageLabel(language)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  activeButton: {
    backgroundColor: "#007AFF",
  },
  languageText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeText: {
    color: "#fff",
  },
});

export default LanguageSwitcher;
