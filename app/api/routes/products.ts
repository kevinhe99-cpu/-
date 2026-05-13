import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { products } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export const productsRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        category: z.enum(["food", "medicine", "supplement"]).optional(),
        status: z.enum(["expired", "expiring_soon", "normal"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.category) {
        conditions.push(eq(products.category, input.category));
      }

      let query = db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const allProducts = await query;

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const formatted = allProducts.map((p) => {
        const expiry = new Date(p.expiryDate);
        let status: "expired" | "expiring_soon" | "normal";

        if (expiry < now) {
          status = "expired";
        } else if (expiry <= thirtyDaysFromNow) {
          status = "expiring_soon";
        } else {
          status = "normal";
        }

        return { ...p, status };
      });

      if (input?.status) {
        return formatted.filter((p) => p.status === input.status);
      }

      return formatted;
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id));
      return result[0] || null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["food", "medicine", "supplement"]),
        expiryDate: z.string().min(1),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(products).values({
        name: input.name,
        category: input.category,
        expiryDate: new Date(input.expiryDate),
        imageUrl: input.imageUrl,
        notes: input.notes,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.enum(["food", "medicine", "supplement"]).optional(),
        expiryDate: z.string().min(1).optional(),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      await db.update(products).set(updateData).where(eq(products.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const allProducts = await db.select().from(products);

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const stats = {
      total: allProducts.length,
      food: 0,
      medicine: 0,
      supplement: 0,
      expired: 0,
      expiringSoon: 0,
      normal: 0,
    };

    for (const p of allProducts) {
      const expiry = new Date(p.expiryDate);
      stats[p.category]++;

      if (expiry < now) {
        stats.expired++;
      } else if (expiry <= thirtyDaysFromNow) {
        stats.expiringSoon++;
      } else {
        stats.normal++;
      }
    }

    return stats;
  }),
});
