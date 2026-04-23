import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import teamsRouter from "./teams";
import venuesRouter from "./venues";
import notifsRouter from "./notifications";
import hostsRouter from "./hostProfiles";
import eventsRouter from "./events";
import publicMatchesRouter from "./publicMatches";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(teamsRouter);
router.use(venuesRouter);
router.use(notifsRouter);
router.use(hostsRouter);
router.use(eventsRouter);
router.use(publicMatchesRouter);
router.use(ordersRouter);

export default router;
