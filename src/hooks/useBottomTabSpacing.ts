import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 70;

export function useBottomTabSpacing() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
}
