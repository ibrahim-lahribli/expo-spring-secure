/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/src/lib/zakat-engine/"],
  testMatch: ["<rootDir>/src/tests/**/*.test.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*|zustand|i18next|react-i18next|i18next-icu|react-native-paper|react-native-mmkv|@sentry/.*)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/app/**",
    "!src/lib/zakat-engine/**",
    "!src/**/*.d.ts",
    "!src/examples/**",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "jsdom",
  globals: {
    __DEV__: true,
  },
};