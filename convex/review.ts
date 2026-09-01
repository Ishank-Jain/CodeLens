import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const saveReview = mutation({
  args: {
    repoFullName: v.string(),
    filePath: v.string(),
    fileSha: v.string(),
    reviewContent: v.optional(v.string()),
    clerkId: v.string(),
    owner: v.string(),
    status: v.union(
      v.literal("Reviewing your code..."),
      v.literal("Completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    if (!args.repoFullName || !args.fileSha) {
      throw new ConvexError({
        message: "Repo full name and file SHA are required",
        code: "INVALID_ARGUMENT",
      });
    }
    // Check if a review for this exact file version already exists
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_file_sha", (q) =>
        q
          .eq("repoFullName", args.repoFullName)
          .eq("fileSha", args.fileSha)
          .eq("clerkId", args.clerkId)
      )
      .first();

    if (existingReview) {
      if (args.status === "Completed") {
        // Update the existing review
        await ctx.db.patch(existingReview._id, {
          reviewContent: [args.reviewContent!, ...existingReview.reviewContent],
          status: args.status,
        });
      } else {
        await ctx.db.patch(existingReview._id, {
          status: args.status,
        });
      }
      return existingReview._id;
    } else {
      const reviewId = await ctx.db.insert("reviews", {
        repoFullName: args.repoFullName,
        filePath: args.filePath,
        fileSha: args.fileSha,
        reviewContent: [],
        clerkId: args.clerkId,
        status: args.status,
        owner: args.owner,
      });
      return reviewId;
    }
  },
});

export const getReviewForFile = query({
  args: {
    repoFullName: v.string(),
    fileSha: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.repoFullName || !args.fileSha) {
      throw new ConvexError({
        message: "Repo full name and file SHA are required",
        code: "INVALID_ARGUMENT",
      });
    }
    // Use the index for a fast lookup
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_file_sha", (q) =>
        q.eq("repoFullName", args.repoFullName).eq("fileSha", args.fileSha)
      )
      .order("desc")
      .first(); // Get the most recent match
    return review;
  },
});
