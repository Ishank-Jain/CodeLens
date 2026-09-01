import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

describe("reviews", () => {
  it("should insert a new review when status is Reviewing", async () => {
    const t = convexTest(schema);
    
    const reviewId = await t.mutation(api.review.saveReview, {
      repoFullName: "owner/repo",
      filePath: "src/index.ts",
      fileSha: "abc123sha",
      clerkId: "test_user",
      owner: "owner",
      status: "Reviewing your code...",
    });
    
    expect(reviewId).toBeDefined();

    const review = await t.query(api.review.getReviewForFile, {
      repoFullName: "owner/repo",
      fileSha: "abc123sha",
    });

    expect(review).not.toBeNull();
    expect(review?.status).toBe("Reviewing your code...");
    expect(review?.reviewContent).toEqual([]);
  });

  it("should update existing review with content when status is Completed", async () => {
    const t = convexTest(schema);
    
    await t.mutation(api.review.saveReview, {
      repoFullName: "owner/repo",
      filePath: "src/index.ts",
      fileSha: "def456sha",
      clerkId: "test_user",
      owner: "owner",
      status: "Reviewing your code...",
    });

    await t.mutation(api.review.saveReview, {
      repoFullName: "owner/repo",
      filePath: "src/index.ts",
      fileSha: "def456sha",
      clerkId: "test_user",
      owner: "owner",
      status: "Completed",
      reviewContent: "Looks good!",
    });

    const review = await t.query(api.review.getReviewForFile, {
      repoFullName: "owner/repo",
      fileSha: "def456sha",
    });

    expect(review?.status).toBe("Completed");
    expect(review?.reviewContent).toEqual(["Looks good!"]);
  });
});
