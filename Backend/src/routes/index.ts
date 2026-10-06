import { Router } from "express";
import { adminRouter } from "./adminRoutes";
import { authRouter } from "./authRoutes";
import { categoryRouter } from "./categoryRoutes";
import { communityRouter } from "./communityRoutes";
import { favoriteRouter } from "./favoriteRoutes";
import { listingRouter } from "./listingRoutes";
import { reportRouter } from "./reportRoutes";
import { sellerRouter } from "./sellerRoutes";
import { userRouter } from "./userRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/sellers", sellerRouter);
apiRouter.use("/listings", listingRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/community-posts", communityRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/admin", adminRouter);
