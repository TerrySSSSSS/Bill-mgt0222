const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加 WASM 支持以便在 web 平台使用 SQLite
config.resolver.assetExts.push('wasm');

// 确保 SQLite WASM 文件可以被正确加载
config.resolver.sourceExts = [...config.resolver.sourceExts, 'sql'];

module.exports = config;
