import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

describe("users", () => {
  it("should upsert a user from Clerk", async () => {
    const t = convexTest(schema);
    
    const mockClerkData = {
      id: "test_clerk_123",
      first_name: "Test",
      last_name: "User",
      email_addresses: [{ email_address: "test@example.com" }],
      image_url: "https://example.com/img.png",
    };

    await t.mutation(internal.users.upsertFromClerk, { data: mockClerkData as any });
    
    // Verify user was created
    const user = await t.query(api.users.getUser, { userId: "test_clerk_123" });
    expect(user).not.toBeNull();
    expect(user?.clerkId).toBe("test_clerk_123");
    expect(user?.name).toBe("Test User");
    expect(user?.plan).toBe("free");
    expect(user?.reviewsRemaining).toBe(5);
  });

  it("should update reviews remaining", async () => {
    const t = convexTest(schema);
    
    const mockClerkData = {
      id: "test_clerk_456",
      first_name: "Test2",
      last_name: "User2",
      email_addresses: [{ email_address: "test2@example.com" }],
      image_url: "",
    };

    await t.mutation(internal.users.upsertFromClerk, { data: mockClerkData as any });
    
    // update reviews remaining
    await t.mutation(api.users.updateReviewsRemaining, { clerkId: "test_clerk_456" });
    
    const user = await t.query(api.users.getUser, { userId: "test_clerk_456" });
    expect(user?.reviewsRemaining).toBe(4);
  });

  it("should update plan using auth identity", async () => {
    const t = convexTest(schema);
    
    const mockClerkData = {
      id: "test_clerk_789",
      first_name: "Test3",
      last_name: "User3",
      email_addresses: [],
      image_url: "",
    };

    await t.mutation(internal.users.upsertFromClerk, { data: mockClerkData as any });
    
    const authedClient = t.withIdentity({ subject: "test_clerk_789" });
    
    await authedClient.mutation(api.users.updatePlan, { plan: "pro" });
    
    const user = await t.query(api.users.getUser, { userId: "test_clerk_789" });
    expect(user?.plan).toBe("pro");
  });
});
