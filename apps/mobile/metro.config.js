// Metro configuration for the pnpm monorepo. Lets the Expo app watch and
// resolve the workspace packages (e.g. @ummahlibrary/core) outside its dir.
// See https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so changes in packages/* are picked up.
//    Append to (don't replace) Expo's defaults so the bundler keeps watching
//    everything it expects to.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// 2. Resolve modules from the app first, then the workspace root.
//    Hierarchical lookup stays ON: pnpm's isolated store relies on each
//    package resolving its deps from its own .pnpm/<pkg>/node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
