import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { GitHubClient } from "github-core";

/** This server's tool runner: effects may require the GitHub client and nothing else. */
export type ToolRunner = GenericToolRunner<GitHubClient>;
