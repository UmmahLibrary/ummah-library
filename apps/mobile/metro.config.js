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

// 3. Don't watch/crawl apps/web's Next.js build output. Watching the whole
//    workspace root (above) sweeps it in, and Next constantly creates and
//    deletes files under .next while compiling — Metro's Windows fallback
//    watcher throws ENOENT and crashes when a dir vanishes mid-scan.
//    Build the pattern from an escaped absolute path (not a literal "/"
//    regex) so it matches on Windows, where paths use "\" separators.
//    Append to (don't replace) Expo's default blockList RegExp.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const defaultBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(defaultBlockList
    ? Array.isArray(defaultBlockList)
      ? defaultBlockList
      : [defaultBlockList]
    : []),
  new RegExp(`${escapeRegExp(path.join(workspaceRoot, "apps", "web", ".next"))}.*`),
  new RegExp(`${escapeRegExp(path.join(workspaceRoot, "apps", "web", "out"))}.*`),
];

// 4. One React for the whole bundle. Workspace packages (packages/ui) keep
//    their own React as a dev dependency for their tests; if Metro resolved
//    `react` from there, shared components that use hooks would run against a
//    second React and crash ("Cannot read property 'useContext' of null").
//    Resolve these singletons as if every import came from the app itself.
const SINGLETONS = ["react", "react-native", "react-native-svg"];
const appOrigin = path.join(projectRoot, "package.json");
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const singleton = SINGLETONS.some((m) => moduleName === m || moduleName.startsWith(`${m}/`));
  const ctx = singleton ? { ...context, originModulePath: appOrigin } : context;
  return upstreamResolve
    ? upstreamResolve(ctx, moduleName, platform)
    : context.resolveRequest(ctx, moduleName, platform);
};

module.exports = config;
