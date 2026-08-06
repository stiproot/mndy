import { z } from "zod";

export const contributorInsightsRequestSchema = z.object({
  owner: z.string().min(1, "Repository owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  username: z.string().min(1, "GitHub username is required"),
  options: z
    .object({
      includeClosedIssues: z.boolean().default(true),
      lookbackDays: z.number().min(1).max(365).default(90),
      maxIssues: z.number().min(1).max(100).default(50),
    })
    .optional(),
});

export type ContributorInsightsRequest = z.infer<
  typeof contributorInsightsRequestSchema
>;
