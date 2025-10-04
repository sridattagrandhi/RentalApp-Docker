// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  // 1) Pull in Expo’s default Metro config:
  const config = await getDefaultConfig(__dirname);

  // 2) Make sure we do NOT wipe out defaultResolver.mainFields.
  //    In an Expo/React Native project, mainFields should already start with:
  //       ["react-native", "browser", "main"]
  //    We simply reassign resolver, preserving mainFields and adding any extras.
  config.resolver = {
    // Keep the same “mainFields” as Expo’s default (so “react-native” stays first)
    mainFields: config.resolver.mainFields, // e.g. ["react-native", "browser", "main"]

    // You can add “cjs” or other extensions **after** the existing ones:
    sourceExts: [...config.resolver.sourceExts, "cjs"],

    // Preserve any blacklist/exclusion and extraNodeModules if you are using them:
    blacklistRE: config.resolver.blacklistRE,
    extraNodeModules: config.resolver.extraNodeModules,

    // Do NOT spread defaultResolver here (that would reset mainFields to ["browser","main"])
  };

  return config;
})();
