/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// 智能记账APP主题色 - 浅蓝色和白色配色
const tintColorLight = '#4A90E2';
const tintColorDark = '#5BA3F5';

export const Colors = {
  light: {
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    background: '#F0F4F8',
    card: '#FFFFFF',
    tint: tintColorLight,
    icon: '#7F8C8D',
    tabIconDefault: '#BDC3C7',
    tabIconSelected: tintColorLight,
    // 记账APP专用色
    primary: '#4A90E2',
    primaryLight: '#E3F2FD',
    income: '#27AE60',
    expense: '#E74C3C',
    gradient: ['#4A90E2', '#5BA3F5', '#6BB6FF'],
    cardGradient: ['#4A90E2', '#5BA3F5', '#6BB6FF'],
    border: '#E8EDF2',
  },
  dark: {
    text: '#ECEFF1',
    textSecondary: '#90A4AE',
    background: '#1A1F2E',
    card: '#263238',
    tint: tintColorDark,
    icon: '#90A4AE',
    tabIconDefault: '#546E7A',
    tabIconSelected: tintColorDark,
    // 记账APP专用色
    primary: '#5BA3F5',
    primaryLight: '#1E3A5F',
    income: '#2ECC71',
    expense: '#EC7063',
    gradient: ['#5BA3F5', '#6BB6FF', '#7AC8FF'],
    cardGradient: ['#5BA3F5', '#6BB6FF', '#7AC8FF'],
    border: '#37474F',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
