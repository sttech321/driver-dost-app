// Metro config tuned for the Firebase JS SDK on React Native / Expo.
// Without these two lines, Metro resolves Firebase's package "exports" to a
// build that crashes at load on a device ("Something went wrong" white screen
// in Expo Go) even though web bundling works. See:
// https://github.com/firebase/firebase-js-sdk/issues/8436
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Firebase's .cjs entry points to resolve.
config.resolver.sourceExts.push('cjs');
// Firebase v11 ships ESM "exports" that break under Metro's resolver.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
