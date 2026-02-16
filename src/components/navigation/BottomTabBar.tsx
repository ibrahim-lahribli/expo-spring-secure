import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    I18nManager,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabItem {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
}

const TABS: TabItem[] = [
  { name: "Calculate", icon: "calculator", route: "/calculate" },
  { name: "History", icon: "history", route: "/history" },
  { name: "Profile", icon: "account", route: "/profile" },
];

export function BottomTabBar() {
  const segments = useSegments();
  const router = useRouter();
  const scaleValues = useRef(TABS.map(() => new Animated.Value(1))).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Get current tab from segments (first segment inside (tabs))
  const currentTab = segments[1];

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShow = () => setKeyboardVisible(true);
    const keyboardDidHide = () => setKeyboardVisible(false);

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      keyboardDidShow,
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      keyboardDidHide,
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Hide tab bar when keyboard is visible
  if (keyboardVisible) {
    return null;
  }

  const handleTabPress = (tab: TabItem, index: number) => {
    if (currentTab === tab.route.replace("/", "")) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Press animation
    Animated.sequence([
      Animated.timing(scaleValues[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate
    router.push(tab.route as any);
  };

  // For RTL, we need to reverse the tab order
  const tabs = I18nManager.isRTL ? [...TABS].reverse() : TABS;

  return (
    <View
      style={[
        styles.container,
        {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = currentTab === tab.route.replace("/", "");
          const originalIndex = I18nManager.isRTL
            ? TABS.length - 1 - index
            : index;

          return (
            <Pressable
              key={tab.route}
              style={styles.tab}
              onPress={() => handleTabPress(tab, originalIndex)}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}
              hitSlop={10}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [{ scale: scaleValues[originalIndex] }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={24}
                  color={isActive ? "#1F7A6B" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? "#1F7A6B" : "#9CA3AF" },
                  ]}
                >
                  {tab.name}
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
