// Binary font assets (bundled by Metro) imported from TypeScript resolve to an
// asset module id (a number) that expo-font's `useFonts` accepts.
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
