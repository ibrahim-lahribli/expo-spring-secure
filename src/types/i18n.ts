/**
 * Type definitions for internationalization
 */

export interface TranslationResources {
  common: {
    ok: string;
    cancel: string;
    save: string;
    continue: string;
    delete: string;
    edit: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    back: string;
    next: string;
    finish: string;
    submit: string;
    clear: string;
    search: string;
    filter: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    signup: string;
    email: string;
    password: string;
    name: string;
    welcome: string;
  };
  auth: {
    login: string;
    signup: string;
    logout: string;
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    forgotPassword: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    createAccount: string;
    signInToAccount: string;
    createYourAccount: string;
    loginSuccess: string;
    signupSuccess: string;
    loginFailed: string;
    signupFailed: string;
    invalidCredentials: string;
    emailNotConfirmed: string;
    tooManyAttempts: string;
    userAlreadyExists: string;
    passwordRequirements: string;
    invalidEmail: string;
  };
  home: {
    title: string;
    welcomeMessage: string;
    email: string;
    signOut: string;
  };
  errors: {
    network: string;
    required: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordsNotMatch: string;
    generic: string;
    serverError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    timeout: string;
  };
  navigation: {
    login: string;
    signup: string;
    home: string;
    profile: string;
    settings: string;
  };
  validation: {
    required: string;
    email: string;
    minLength: string;
    maxLength: string;
    passwordMatch: string;
  };
}

/**
 * Supported language types
 */
export type SupportedLanguage = 'ar' | 'fr' | 'en';

/**
 * Language switcher hook return type
 */
export interface LanguageSwitcherReturn {
  currentLanguage: SupportedLanguage;
  switchLanguage: (language: SupportedLanguage) => Promise<void>;
  isRTL: boolean;
  supportedLanguages: SupportedLanguage[];
}

/**
 * Language switcher component props
 */
export interface LanguageSwitcherProps {
  style?: any;
  buttonStyle?: any;
  textStyle?: any;
}

/**
 * RTL utility return types
 */
export type TextAlignment = 'left' | 'right' | 'center';
export type FlexDirectionType = 'row' | 'row-reverse';
export type MarginType = 'marginLeft' | 'marginRight';
export type PaddingType = 'paddingLeft' | 'paddingRight';
export type WritingDirection = 'ltr' | 'rtl';

/**
 * RTL styles interface
 */
export interface RTLStyles {
  textAlign: TextAlignment;
  flexDirection: FlexDirectionType;
  writingDirection: WritingDirection;
}
