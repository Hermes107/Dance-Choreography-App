import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stagecraftRouter from "./stagecraft";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stagecraftRouter);

export default router;
