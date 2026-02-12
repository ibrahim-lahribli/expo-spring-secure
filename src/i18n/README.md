# Internationalization (i18n) Implementation

This directory contains the complete internationalization system for the React Native + Expo app.

## 📁 Structure

```
src/i18n/
├── i18n.ts              # Main i18n configuration and utilities
├── locales/             # Translation files
│   ├── en.json          # English translations (fallback)
│   ├── fr.json          # French translations
│   └── ar.json          # Arabic translations (primary)
└── README.md            # This file
```

## 🌍 Language Priority

The app supports 3 languages in this priority order:

1. **Arabic (ar)** - PRIMARY language
2. **French (fr)** - SECOND fallback  
3. **English (en)** - FINAL fallback

## 🔧 Configuration

### Language Detection

- Uses `expo-localization` to detect device locale on app startup
- Extracts language code only (ar, fr, en)
- Defaults to "en" if device language is not supported

### Fallback Chain

If a translation key is missing:
```
Arabic → fallback to French → fallback to English
```

### RTL Support

- Arabic automatically enables RTL layout via `I18nManager`
- App restarts when switching between RTL/LTR
- Layout fully supports RTL (text alignment, flex direction)

## 🚀 Usage

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('common.ok')}</Text>;
}
```

### Translation with Interpolation

```tsx
<Text>{t('home.welcomeMessage', { name: 'John' })}</Text>
```

### Language Switching

```tsx
import { useLanguageSwitcher } from '../i18n/i18n';

function LanguageSelector() {
  const { currentLanguage, switchLanguage, supportedLanguages } = useLanguageSwitcher();
  
  return (
    <View>
      {supportedLanguages.map(lang => (
        <Button 
          key={lang}
          title={lang}
          onPress={() => switchLanguage(lang)}
        />
      ))}
    </View>
  );
}
```

### RTL Utilities

```tsx
import { getTextAlign, getFlexDirection } from '../utils/rtlUtils';

const styles = StyleSheet.create({
  container: {
    flexDirection: getFlexDirection(currentLanguage),
  },
  text: {
    textAlign: getTextAlign(currentLanguage),
  },
});
```

## 📱 Components

### LanguageSwitcher

A reusable component for language selection:

```tsx
import { LanguageSwitcher } from '../components/LanguageSwitcher';

<LanguageSwitcher 
  style={customStyle}
  buttonStyle={customButtonStyle}
  textStyle={customTextStyle}
/>
```

## 🔤 Translation Keys

### Common UI Elements
- `common.ok`, `common.cancel`, `common.save`, `common.continue`
- `common.loading`, `common.error`, `common.success`

### Authentication
- `auth.login`, `auth.signup`, `auth.logout`
- `auth.email`, `auth.password`, `auth.name`

### Home Screen
- `home.title`, `home.welcomeMessage`, `home.signOut`

### Errors & Validation
- `errors.network`, `errors.required`
- `validation.email`, `validation.minLength`

## 💾 Persistence

- Language preferences are saved using `AsyncStorage`
- On app launch, saved language is loaded before device language
- Storage key: `@app_language`

## 🔄 App Initialization

The i18n system is initialized in `src/app/_layout.tsx`:

1. Load saved language from storage
2. Detect device language if no saved language
3. Initialize RTL for Arabic
4. Configure i18next with fallback chain
5. Wrap app with `I18nextProvider`

## 🛠 Development

### Adding New Translations

1. Add keys to all three language files:
   ```json
   // en.json
   { "new.key": "New value" }
   
   // fr.json  
   { "new.key": "Nouvelle valeur" }
   
   // ar.json
   { "new.key": "قيمة جديدة" }
   ```

2. Use in components:
   ```tsx
   {t('new.key')}
   ```

### Adding New Languages

1. Create new locale file: `locales/xx.json`
2. Add language to `SUPPORTED_LANGUAGES` in `i18n.ts`
3. Add language labels to `LanguageSwitcher.tsx`
4. Update documentation

## 🎯 Best Practices

1. **Never hardcode strings** - Always use translation keys
2. **Use descriptive keys** - Group by feature (e.g., `auth.login`)
3. **Provide context** - Use interpolation for dynamic values
4. **Test all languages** - Verify text fits and RTL works
5. **Handle missing keys** - Use fallback chain effectively

## 🔍 Debugging

### Check Current Language
```tsx
import { getCurrentLanguage } from '../i18n/i18n';
console.log(getCurrentLanguage()); // 'ar' | 'fr' | 'en'
```

### Check RTL Status
```tsx
import { isRTL } from '../i18n/i18n';
console.log(isRTL(currentLanguage)); // true for Arabic
```

### Force Language Change
```tsx
import { changeLanguage } from '../i18n/i18n';
await changeLanguage('ar');
```

## 📚 Additional Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [React Native RTL Support](https://reactnative.dev/docs/layout-props#textalign)
