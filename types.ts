export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: { [key: string]: FileNode };
}

export interface RepoDetails {
  owner: string;
  repo: string;
}

export interface FileDetails {
  path: string;
  content: string;
  sha: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string;
}

export interface GitHubRepoInfo {
  default_branch: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
  description: string | null;
  updated_at: string;
  language: string | null;
  fork: boolean;
}
