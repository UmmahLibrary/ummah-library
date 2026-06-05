/**
 * @ummahlibrary/api
 *
 * The application layer: the configured repositories plus the tRPC router that
 * exposes the core ports as a typed read API. Apps depend on `api` — never on
 * `data` directly — keeping the dependency direction app → api → core/data.
 */
export * from "./repositories";
export { appRouter } from "./trpc";
export type { AppRouter } from "./trpc";
