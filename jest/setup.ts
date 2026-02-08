// Jest setup: mock native modules used by the app

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
try {
	// Some RN versions expose this helper; mock if present to silence warnings
	jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');
} catch (e) {
	// ignore if module path doesn't exist in this RN version
}

// Mock react-native-device-info to avoid NativeEventEmitter instantiation in tests
jest.mock('react-native-device-info', () => ({
	getUniqueId: () => 'test-device-id',
	getDeviceId: () => 'test-device',
	getSystemVersion: () => 'test-os',
	getVersion: () => '1.0.0',
	getApplicationName: () => 'PixlmeTv',
}));

// Mock keyboard-aware-scroll-view
jest.mock('react-native-keyboard-aware-scroll-view', () => {
	const React = require('react');
	const {View} = require('react-native');
	const KeyboardAwareScrollView = ({children, ...props}: any) => React.createElement(View, props, children);
	return {KeyboardAwareScrollView};
});

// Mock iphone-x-helper
jest.mock('react-native-iphone-x-helper', () => ({
	getStatusBarHeight: () => 0,
	isIphoneX: () => false,
}));

// Mock other heavy native modules to avoid transform issues
jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons', () => ({}));
jest.mock('react-native-gesture-handler', () => ({
	Swipeable: 'Swipeable',
	DrawerLayout: 'DrawerLayout',
	GestureHandlerRootView: 'GestureHandlerRootView',
}));
jest.mock('react-native-reanimated', () => {
	const Reanimated = require('react-native-reanimated/mock');
	// Silence the layout warning
	Reanimated.default = Reanimated;
	return Reanimated;
});

// Mock toast message library
jest.mock('react-native-toast-message', () => {
	const React = require('react');
	const {View} = require('react-native');
	const MockToast = () => React.createElement(View, null);
	MockToast.show = jest.fn();
	MockToast.hide = jest.fn();
	return MockToast;
});

// Mock react-native-devsettings (and its withAsyncStorage side-effect import)
jest.mock('react-native-devsettings', () => ({
	addMenuItem: jest.fn(),
	toggle: jest.fn(),
}));
jest.mock('react-native-devsettings/withAsyncStorage', () => ({}));

// Mock keyevent module
jest.mock('react-native-keyevent', () => ({
	registerKeyDownListener: jest.fn(),
	registerKeyUpListener: jest.fn(),
	removeKeyDownListener: jest.fn(),
	removeKeyUpListener: jest.fn(),
}));
