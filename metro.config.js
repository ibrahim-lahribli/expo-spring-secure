const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Extend sourceExts to support .cjs and .mjs files (for packages like nanoid, use-latest-callback)
// Important: We extend the existing array to preserve platform-specific file resolution (.web.tsx, .ios.tsx, etc.)
const defaultSourceExts = config.resolver.sourceExts || [];
config.resolver.sourceExts = [...defaultSourceExts, 'cjs', 'mjs'];

module.exports = config;
