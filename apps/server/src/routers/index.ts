import {
  protectedProcedure, publicProcedure,
  router,
} from "../lib/trpc";
import { jobTrackingRouter } from "./job-tracking";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private data - user is authenticated",
      user: ctx.session.user,
    };
  }),
  jobTracking: jobTrackingRouter,
});

export type AppRouter = typeof appRouter;
