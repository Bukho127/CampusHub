import { Router } from "express";
import { listOpenPolls, voteOnPoll } from "../controllers/pollController";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { z } from "zod";

export const pollRouter = Router();
pollRouter.get("/", optionalAuthenticate, listOpenPolls);
pollRouter.post("/:id/votes", authenticate, validate({ params: mongoIdParamSchema, body: z.object({ optionIndex: z.number().int().min(0).max(9) }) }), voteOnPoll);
