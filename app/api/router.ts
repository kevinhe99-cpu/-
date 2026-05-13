import { createRouter, publicQuery } from "./middleware";
import { productsRouter } from "./routes/products";
import { aiRouter } from "./routes/ai";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  products: productsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
