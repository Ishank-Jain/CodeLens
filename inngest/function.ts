import { fetchMutation } from "convex/nextjs";

import { inngest } from "./client";
import { inngestFetchFileContent } from "@/services/githubService";
import { api } from "@/convex/_generated/api";
import { NonRetriableError } from "inngest";

export const reviewCode = inngest.createFunction(
  {
    id: "code-sight-ai",
    onFailure: async ({ event, error }) => {
      const { repoFullName, sha, clerkId, filePath, owner } =
        event.data.event.data;
      await fetchMutation(api.review.saveReview, {
        repoFullName,
        fileSha: sha,
        filePath,
        owner,
        clerkId,
        status: "failed",
      });
    },
  },
  { event: "code.sight.ai/review" },
  async ({ event, step }) => {
    const {
      filePath,
      repoFullName,
      owner,
      hasProPlan,
      repo,
      sha,
      clerkId,
      token,
    } = event.data;
    if (
      !filePath ||
      !repoFullName ||
      !owner ||
      !repo ||
      !sha ||
      !clerkId ||
      !token
    ) {
      throw new NonRetriableError("Missing required event data");
    }
    await step.run("Create Review", async () => {
      const reviewId = await fetchMutation(api.review.saveReview, {
        repoFullName,
        filePath,
        fileSha: sha,
        owner,
        status: "Reviewing your code...",
        clerkId,
      });
      return { reviewId };
    });

    const { content } = await step.run("Fetch File", async () => {
      const { content } = await inngestFetchFileContent(
        owner,
        repo,
        filePath,
        token
      );
      return { content };
    });

    const prompt = `
    You are an expert senior software engineer and an exceptional code reviewer.
    Analyze the following code from the file \`${filePath}\`.

    Provide a comprehensive review focusing on the following aspects:
    1.  **Potential Bugs**: Identify any logical errors, race conditions, or edge cases that could lead to bugs.
    2.  **Performance Issues**: Suggest optimizations for any inefficient code, memory leaks, or unnecessary computations.
    3.  **Best Practices & Readability**: Comment on code style, naming conventions, and overall readability. Suggest improvements based on established best practices for the language/framework.
    4.  **Security Vulnerabilities**: Point out any potential security risks (e.g., XSS, injection vulnerabilities, improper error handling), if applicable.
    5.  **Maintainability & Scalability**: Assess how easy the code is to modify, extend, and maintain. Suggest ways to improve its structure.

    Structure your review using Markdown. Use clear headings for each section.
    For each point, provide a brief explanation and a concrete code suggestion if possible.
    If no issues are found in a particular category, state that clearly.
    Be constructive and professional in your feedback.

    Here is the code:
    \`\`\`
    ${content}
    \`\`\`
  `;

    const markdownContent = await step.run("Generate Review", async () => {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      return response.text || "No review generated.";
    });

    const Result = await step.run("Save Result", async () => {
      const reviewId = await fetchMutation(api.review.saveReview, {
        repoFullName,
        filePath,
        fileSha: sha,
        reviewContent: markdownContent as string,
        owner,
        clerkId,
        status: "Completed",
      });
      if (!hasProPlan) {
        await fetchMutation(api.users.updateReviewsRemaining, {
          clerkId,
        });
      }
      return { reviewId, markdownContent };
    });

    return Result;
  }
);
