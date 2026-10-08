/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/enter-code` | `/(auth)/forgot-password` | `/(auth)/login` | `/(auth)/register` | `/(auth)/verify-email` | `/(tabs)` | `/(tabs)/` | `/(tabs)/community` | `/(tabs)/explore` | `/(tabs)/profile` | `/(tabs)/sell` | `/(tabs)\` | `/_sitemap` | `/cart` | `/checkout` | `/community` | `/enter-code` | `/explore` | `/forgot-password` | `/login` | `/payments/snapscan` | `/profile` | `/register` | `/sell` | `/verify-email`;
      DynamicRoutes: `/product/${Router.SingleRoutePart<T>}` | `/seller/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/product/[id]` | `/seller/[id]`;
    }
  }
}
