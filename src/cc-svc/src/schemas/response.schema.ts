import { z } from "zod";

// Theme schema
const themeSchema = z.object({
  name: z.string(),
  count: z.number(),
  examples: z.array(z.string()),
});

// Issue analysis sub-schema
const issueAnalysisSchema = z.object({
  totalIssues: z.number(),
  openIssues: z.number(),
  closedIssues: z.number(),
  themes: z.array(themeSchema),
  issueTypes: z.object({
    bugs: z.number(),
    features: z.number(),
    questions: z.number(),
    other: z.number(),
  }),
  averageBodyLength: z.number(),
  issuesWithLabels: z.number(),
});

// Activity tracking sub-schema
const activityTrackingSchema = z.object({
  firstContribution: z.string().nullable(),
  lastContribution: z.string().nullable(),
  activeDays: z.number(),
  averageIssuesPerMonth: z.number(),
  mostActiveMonth: z.string().nullable(),
  contributionTrend: z.enum(["increasing", "stable", "decreasing", "sporadic"]),
  activityPattern: z
    .object({
      weekdays: z.record(z.number()),
      timeOfDay: z.record(z.number()),
    })
    .optional(),
});

// Quality assessment sub-schema
const qualityAssessmentSchema = z.object({
  resolutionRate: z.number().min(0).max(100),
  averageComments: z.number(),
  averageTimeToClose: z.string().nullable(),
  qualityScore: z.number().min(0).max(100),
  qualityFactors: z.object({
    detailLevel: z.enum(["low", "medium", "high"]),
    reproducibilityInfo: z.boolean(),
    labelAccuracy: z.enum(["poor", "fair", "good", "excellent"]),
  }),
});

// Recommendation schema
const recommendationSchema = z.object({
  category: z.string(),
  suggestion: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

// Main response schema
export const contributorInsightsResponseSchema = z.object({
  contributor: z.object({
    username: z.string(),
    repository: z.string(),
    analyzedAt: z.string(),
  }),
  summary: z.object({
    overallScore: z.number().min(0).max(100),
    impactLevel: z.enum([
      "minimal",
      "low",
      "moderate",
      "high",
      "significant",
    ]),
    briefDescription: z.string(),
  }),
  issueAnalysis: issueAnalysisSchema,
  activityTracking: activityTrackingSchema,
  qualityAssessment: qualityAssessmentSchema,
  insights: z.object({
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    recommendations: z.array(recommendationSchema),
  }),
  metadata: z.object({
    analysisVersion: z.string(),
    dataRange: z.object({
      from: z.string().nullable(),
      to: z.string().nullable(),
    }),
    issuesAnalyzed: z.number(),
    processingTimeMs: z.number(),
  }),
});

export type ContributorInsightsResponse = z.infer<
  typeof contributorInsightsResponseSchema
>;

// Partial schemas for sub-agent outputs
export const issueAnalyzerOutputSchema = z.object({
  totalIssues: z.number(),
  openIssues: z.number().optional(),
  closedIssues: z.number().optional(),
  themes: z.array(themeSchema),
  issueTypes: z.object({
    bugs: z.number(),
    features: z.number(),
    questions: z.number(),
    other: z.number(),
  }),
  averageBodyLength: z.number().optional(),
  issuesWithLabels: z.number().optional(),
  qualityObservations: z.array(z.string()).optional(),
});

export const activityTrackerOutputSchema = z.object({
  firstContribution: z.string().nullable(),
  lastContribution: z.string().nullable(),
  activeDays: z.number().optional(),
  averageIssuesPerMonth: z.number(),
  mostActiveMonth: z.string().nullable().optional(),
  contributionTrend: z.enum(["increasing", "stable", "decreasing", "sporadic"]),
  monthlyBreakdown: z.record(z.number()).optional(),
});

export const qualityAssessorOutputSchema = z.object({
  resolutionRate: z.number().min(0).max(100),
  averageComments: z.number(),
  qualityScore: z.number().min(0).max(100),
  qualityFactors: z.object({
    detailLevel: z.enum(["low", "medium", "high"]),
    reproducibilityInfo: z.boolean(),
    labelAccuracy: z.enum(["poor", "fair", "good", "excellent"]),
  }),
  observations: z.array(z.string()).optional(),
});

export type IssueAnalyzerOutput = z.infer<typeof issueAnalyzerOutputSchema>;
export type ActivityTrackerOutput = z.infer<typeof activityTrackerOutputSchema>;
export type QualityAssessorOutput = z.infer<typeof qualityAssessorOutputSchema>;
