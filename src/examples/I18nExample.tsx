import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguageSwitcher } from '../i18n/i18n';

/**
 * Example component demonstrating comprehensive i18n usage
 */
export function I18nExample() {
  const { t } = useTranslation(['common', 'auth', 'home', 'errors']);
  const { currentLanguage, isRTL } = useLanguageSwitcher();

  const showAlert = () => {
    Alert.alert(
      t('error'),
      t('errors:network'),
      [{ text: t('ok') }]
    );
  };

  const showSuccess = () => {
    Alert.alert(
      t('success'),
      t('auth:loginSuccess'),
      [{ text: t('ok') }]
    );
  };

  const showNavigation = () => {
    Alert.alert(
      t('navigation.home'),
      '',
      [{ text: t('ok') }]
    );
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t('home:title')}
      </Text>

      <LanguageSwitcher style={styles.switcher} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t('welcome')}
        </Text>
        <Text style={[styles.text, isRTL && styles.rtlText]}>
          {t('home:welcomeMessage', { name: 'John Doe' })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t('auth:login')}
        </Text>
        <Text style={[styles.text, isRTL && styles.rtlText]}>
          {t('auth:email')}: user@example.com
        </Text>
        <Text style={[styles.text, isRTL && styles.rtlText]}>
          {t('auth:password')}: ********
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t('errors:network')}
        </Text>
        <Text style={[styles.text, isRTL && styles.rtlText]}>
          {t('validation.required')}
        </Text>
        <Text style={[styles.text, isRTL && styles.rtlText]}>
          {t('validation.minLength', { count: 6 })}
        </Text>
      </View>

      <View style={[styles.buttonContainer, isRTL && styles.rtlButtonContainer]}>
        <Text style={[styles.info, isRTL && styles.rtlText]}>
          Current Language: {currentLanguage} | RTL: {isRTL ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  rtlContainer: {
    // RTL-specific styles if needed
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
  },
  switcher: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  rtlButtonContainer: {
    // RTL-specific button container styles
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default I18nExample;
