import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchUserRepos, fetchRepoInfo, fetchRepoTree, fetchFileContent } from "./githubService";
import { getToken } from "./getToken";

// Mock the getToken dependency
vi.mock("./getToken", () => ({
  getToken: vi.fn(),
}));

describe("githubService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("fetchUserRepos should fetch and return repos", async () => {
    vi.mocked(getToken).mockResolvedValue({ token: "test_token" });
    
    const mockResponse = [{ name: "repo1" }, { name: "repo2" }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const repos = await fetchUserRepos();
    
    expect(repos).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/user/repos?visibility=all&sort=updated&per_page=100",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("fetchRepoInfo should return info for a specific repo", async () => {
    vi.mocked(getToken).mockResolvedValue({ token: "test_token" });
    
    const mockResponse = { name: "repo1", default_branch: "main" };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await fetchRepoInfo("owner", "repo1");
    expect(info).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo1",
      expect.anything()
    );
  });

  it("fetchFileContent should decode base64 correctly", async () => {
    vi.mocked(getToken).mockResolvedValue({ token: "test_token" });
    
    const mockResponse = {
      content: Buffer.from("hello world").toString("base64"),
      encoding: "base64",
      sha: "file_sha123",
    };
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchFileContent("owner", "repo1", "README.md");
    expect(result.content).toBe("hello world");
    expect(result.sha).toBe("file_sha123");
  });
});
