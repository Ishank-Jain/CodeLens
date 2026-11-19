import { describe, expect, it, vi, beforeEach } from "vitest";

// We'll mock the inngest client to prevent actual connections
vi.mock("./client", () => ({
  inngest: {
    createFunction: vi.fn((config, trigger, handler) => {
      return { config, trigger, handler };
    }),
  },
}));

vi.mock("convex/nextjs", () => ({
  fetchMutation: vi.fn().mockResolvedValue("mocked_review_id"),
}));

vi.mock("@/services/githubService", () => ({
  inngestFetchFileContent: vi.fn().mockResolvedValue({ content: "function test() {}" }),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn().mockResolvedValue({ text: "Review looks good!" }),
    };
  },
}));

import { reviewCode } from "./function";
import { fetchMutation } from "convex/nextjs";

describe("inngest function - reviewCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct config and trigger", () => {
    expect((reviewCode as any).config.id).toBe("code-sight-ai");
    expect((reviewCode as any).trigger.event).toBe("code.sight.ai/review");
  });

  it("should process the review successfully given valid event data", async () => {
    const handler = (reviewCode as any).handler;

    // Mock the `step.run` behavior
    const step = {
      run: vi.fn(async (name, fn) => {
        return await fn();
      }),
    };

    const event = {
      data: {
        filePath: "src/index.ts",
        repoFullName: "owner/repo",
        owner: "owner",
        hasProPlan: true,
        repo: "repo",
        sha: "abc123sha",
        clerkId: "test_clerk",
        token: "fake_token",
      },
    };

    const result = await handler({ event, step });

    expect(step.run).toHaveBeenCalledTimes(4);

    // Ensure convex mutation was called to save the review
    expect(fetchMutation).toHaveBeenCalled();
    expect(result).toEqual({
      reviewId: "mocked_review_id",
      markdownContent: "Review looks good!",
    });
  });

  it("should throw an error if event data is missing", async () => {
    const handler = (reviewCode as any).handler;

    const event = {
      data: {
        // Missing data
      },
    };

    await expect(handler({ event, step: {} })).rejects.toThrow("Missing required event data");
  });
});
