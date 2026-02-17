import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { ZodError } from "zod";

export const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    
    // Create a human-readable message
    let message = shape.message;
    let zodError = null;
    
    if (error.code === 'BAD_REQUEST' && error.cause instanceof ZodError) {
      zodError = error.cause.flatten();
      const fieldErrors = zodError.fieldErrors as Record<string, string[] | undefined>;
      const errorMessages: string[] = [];
      
      for (const [field, errors] of Object.entries(fieldErrors)) {
        if (errors && Array.isArray(errors) && errors.length > 0) {
          errorMessages.push(`${field}: ${errors.join(', ')}`);
        }
      }
      
      if (errorMessages.length > 0) {
        message = `Validation failed: ${errorMessages.join('; ')}`;
      }
    }
    
    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        // Only include stack in development
        stack: process.env.NODE_ENV === 'development' ? shape.data.stack : undefined,
        zodError,
      },
    };
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  console.log(ctx)
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
