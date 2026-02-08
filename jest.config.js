module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest/setup.ts'],
  // Transform these modules so Jest can handle ESM syntax used by some packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@react-navigation|@react-native-async-storage|react-native-keyboard-aware-scroll-view|react-native-keyevent|react-native-fast-image|react-native-vector-icons|react-native-linear-gradient|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-svg)/)'
  ],
};
