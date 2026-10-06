/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/community` | `/(tabs)/explore` | `/(tabs)/profile` | `/(tabs)/sell` | `/..\Backend\src\app` | `/..\Backend\src\config\db` | `/..\Backend\src\config\env` | `/..\Backend\src\controllers\adminController` | `/..\Backend\src\controllers\authController` | `/..\Backend\src\controllers\communityController` | `/..\Backend\src\controllers\favoriteController` | `/..\Backend\src\controllers\listingController` | `/..\Backend\src\controllers\reportController` | `/..\Backend\src\controllers\userController` | `/..\Backend\src\middleware\auth` | `/..\Backend\src\middleware\errorHandler` | `/..\Backend\src\middleware\upload` | `/..\Backend\src\middleware\validate` | `/..\Backend\src\models\Category` | `/..\Backend\src\models\CommunityPost` | `/..\Backend\src\models\Favorite` | `/..\Backend\src\models\Listing` | `/..\Backend\src\models\Report` | `/..\Backend\src\models\Review` | `/..\Backend\src\models\User` | `/..\Backend\src\routes\` | `/..\Backend\src\routes\adminRoutes` | `/..\Backend\src\routes\authRoutes` | `/..\Backend\src\routes\communityRoutes` | `/..\Backend\src\routes\favoriteRoutes` | `/..\Backend\src\routes\listingRoutes` | `/..\Backend\src\routes\reportRoutes` | `/..\Backend\src\routes\sellerRoutes` | `/..\Backend\src\routes\userRoutes` | `/..\Backend\src\seed\seed` | `/..\Backend\src\server` | `/..\Backend\src\services\tokenService` | `/..\Backend\src\services\uploadService` | `/..\Backend\src\utils\AppError` | `/..\Backend\src\utils\apiResponse` | `/..\Backend\src\utils\asyncHandler` | `/..\Backend\src\validators\adminValidators` | `/..\Backend\src\validators\authValidators` | `/..\Backend\src\validators\commonValidators` | `/..\Backend\src\validators\communityValidators` | `/..\Backend\src\validators\listingValidators` | `/..\Backend\src\validators\reportValidators` | `/..\Backend\src\validators\userValidators` | `/_sitemap` | `/community` | `/explore` | `/profile` | `/sell`;
      DynamicRoutes: `/product/${Router.SingleRoutePart<T>}` | `/seller/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/product/[id]` | `/seller/[id]`;
    }
  }
}
