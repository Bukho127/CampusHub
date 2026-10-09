import type { SingleRoutePart as ExpoSingleRoutePart } from "expo-router/build/typed-routes/types";

declare module "expo-router" {
  export type SingleRoutePart<T extends string> = ExpoSingleRoutePart<T>;
}
