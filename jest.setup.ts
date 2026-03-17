// Extend Jest matchers with @testing-library/jest-native
import "@testing-library/jest-native/extend-expect";

if (typeof global.setImmediate === "undefined") {
  global.setImmediate = ((callback: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(callback, 0, ...args)) as unknown as typeof setImmediate;
}
if (typeof global.clearImmediate === "undefined") {
  global.clearImmediate = ((id: ReturnType<typeof setTimeout>) =>
    clearTimeout(id)) as unknown as typeof clearImmediate;
}

// react-native-reanimated (required for expo-router animations)
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    TouchableHighlight: TouchableOpacity,
    TouchableNativeFeedback: TouchableOpacity,
    TouchableOpacity,
    Directions: {},
  };
});

// expo-localization mock
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", regionCode: "US" }],
  locale: "en-US",
  isRTL: false,
}));

// expo-router mock
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  __routerMock: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => effect(), [effect]);
  },
  useSegments: () => [],
  usePathname: () => "/",
  Link: ({ children }: any) => children,
  Redirect: ({ href }: any) => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// vector icons mock to avoid async font-loading warnings in tests
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const MockIcon = ({ name, children, ...props }: any) =>
    React.createElement(Text, props, children ?? name ?? "icon");
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    },
  );
});

// react-native-paper-dates mock
jest.mock("react-native-paper-dates", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockDatePickerModal = (props: any) =>
    React.createElement(View, {
      ...props,
      testID: props.testID ?? "paper-date-picker-modal",
    });

  return {
    __esModule: true,
    DatePickerModal: MockDatePickerModal,
    registerTranslation: jest.fn(),
    en: {},
    fr: {},
    ar: {},
  };
});

// expo-updates mock
jest.mock("expo-updates", () => ({
  reloadAsync: jest.fn(),
}));

// expo-splash-screen mock
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Supabase client mock — centralized
jest.mock("./src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));
