// Metro config. On SDK 54+ package "exports" resolution is enabled by default
// (which the Firebase JS SDK v11 expects), so we no longer disable it. We keep
// `.cjs` in sourceExts since some deps still ship CommonJS entry points.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

module.exports = config;
