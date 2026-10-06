/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(auth)/register` | `/(tabs)` | `/(tabs)/` | `/(tabs)/community` | `/(tabs)/explore` | `/(tabs)/profile` | `/(tabs)/sell` | `/_sitemap` | `/community` | `/explore` | `/login` | `/profile` | `/register` | `/sell`;
      DynamicRoutes: `/product/${Router.SingleRoutePart<T>}` | `/seller/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/product/[id]` | `/seller/[id]`;
    }
  }
}
