import { Router, type IRouter } from "express";
import { db, hostProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/host-profiles", async (_req, res): Promise<void> => {
  const rows = await db.select().from(hostProfilesTable);
  res.json(rows);
});

router.post("/host-profiles/:userId/rate", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req.params;
  const { rating, comment } = req.body;
  const me = (req as AuthedRequest).user;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Invalid rating" });
    return;
  }

  try {
    const [profile] = await db
      .select()
      .from(hostProfilesTable)
      .where(eq(hostProfilesTable.userId, userId))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "Host not found" });
      return;
    }

    // Check if user already rated this host
    const existingIndex = profile.reviews.findIndex(r => r.reviewerId === me.id);
    const newReview = {
      reviewerId: me.id,
      rating,
      comment: comment || "",
      date: new Date().toISOString(),
    };

    let updatedReviews = [...profile.reviews];
    if (existingIndex >= 0) {
      updatedReviews[existingIndex] = newReview;
    } else {
      updatedReviews.push(newReview);
    }
    
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = totalRating / updatedReviews.length;

    const [updated] = await db
      .update(hostProfilesTable)
      .set({
        reviews: updatedReviews,
        averageRating: newAverageRating,
      })
      .where(eq(hostProfilesTable.userId, userId))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
