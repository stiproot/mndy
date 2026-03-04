#!/usr/bin/env bun
/**
 * Contributor Insights Script
 *
 * Invokes the cc-svc contributor-insights endpoint to analyze a GitHub user's
 * contribution patterns in a repository.
 *
 * Usage:
 *   bun run insights <owner> <repo> <username> [options]
 *
 * Examples:
 *   bun run insights anthropics claude-code octocat
 *   bun run insights anthropics claude-code octocat --lookback-days=30
 *   bun run insights Derivco nebula si-stip-der --lookback-days=30
 *   bun run insights anthropics claude-code octocat --stream
 *   bun run insights anthropics claude-code octocat --output=./report.md
 */

import { resolve } from "path";
import json2md from "json2md";
import type {
  ContributorInsightsRequest,
  ContributorInsightsResponse,
} from "cc-svc/schemas";

// Load .env from scripts directory (parent of src/)
const envPath = resolve(import.meta.dir, "../.env");
await Bun.file(envPath).exists() && Object.assign(process.env,
  Object.fromEntries(
    (await Bun.file(envPath).text())
      .split("\n")
      .filter(line => line && !line.startsWith("#") && line.includes("="))
      .map(line => {
        const [key, ...rest] = line.split("=");
        return [key.trim(), rest.join("=").trim()];
      })
  )
);

const CC_SVC_URL = process.env.CC_SVC_URL ?? "http://localhost:3002";
const ENDPOINT = `${CC_SVC_URL}/cc-svc/contributor-insights`;
const OUTPUT_DIR = resolve(import.meta.dir, "../output");

interface ParsedArgs {
  request: ContributorInsightsRequest;
  stream: boolean;
  output?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Contributor Insights Script

Usage:
  bun run insights <owner> <repo> <username> [options]

Arguments:
  owner       Repository owner (e.g., "anthropics")
  repo        Repository name (e.g., "claude-code")
  username    GitHub username to analyze

Options:
  --stream                 Use SSE streaming for real-time updates
  --output=<path>          Output results to a markdown file (default: scripts/output/<username>-<repo>.md)
  --no-output              Don't write to file, only print to console
  --lookback-days=N        Days to look back (1-365, default: 90)
  --max-issues=N           Max issues to analyze (1-100, default: 50)
  --include-closed=false   Exclude closed issues
  --help, -h               Show this help

Environment:
  CC_SVC_URL    Base URL for cc-svc (default: http://localhost:3002)

Examples:
  bun run insights anthropics claude-code octocat
  bun run insights anthropics claude-code octocat --stream
  bun run insights anthropics claude-code octocat --output=./custom.md
  bun run insights anthropics claude-code octocat --no-output
`);
    process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
  }

  const [owner, repo, username] = args;
  const options: ContributorInsightsRequest["options"] = {};
  let stream = false;
  let output: string | undefined = resolve(OUTPUT_DIR, `${username}-${repo}.md`);
  let noOutput = false;

  for (const arg of args.slice(3)) {
    if (arg === "--stream") {
      stream = true;
    } else if (arg === "--no-output") {
      noOutput = true;
    } else if (arg.startsWith("--output=")) {
      output = arg.split("=")[1];
    } else if (arg.startsWith("--lookback-days=")) {
      options.lookbackDays = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--max-issues=")) {
      options.maxIssues = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--include-closed=")) {
      options.includeClosedIssues = arg.split("=")[1] !== "false";
    }
  }

  return {
    request: {
      owner,
      repo,
      username,
      options: Object.keys(options).length > 0 ? options : undefined,
    },
    stream,
    output: noOutput ? undefined : output,
  };
}

function formatAsMarkdown(data: ContributorInsightsResponse): string {
  const { contributor, summary, issueAnalysis, activityTracking, qualityAssessment, insights, metadata } = data;

  const content: json2md.DataObject[] = [
    { h1: `Contributor Insights: @${contributor.username}` },
    { p: `**Repository:** ${contributor.repository} | **Analyzed:** ${new Date(contributor.analyzedAt).toLocaleString()}` },
    { h2: "Summary" },
    { p: `**Overall Score:** ${summary.overallScore}/100 | **Impact Level:** ${summary.impactLevel}` },
    { p: summary.briefDescription },
    { h2: "Issue Analysis" },
    {
      table: {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Issues", String(issueAnalysis.totalIssues)],
          ["Open Issues", String(issueAnalysis.openIssues)],
          ["Closed Issues", String(issueAnalysis.closedIssues)],
          ["Issues with Labels", String(issueAnalysis.issuesWithLabels)],
          ["Avg Body Length", `${issueAnalysis.averageBodyLength} chars`],
        ],
      },
    },
    { h3: "Issue Types" },
    {
      ul: [
        `Bugs: ${issueAnalysis.issueTypes.bugs}`,
        `Features: ${issueAnalysis.issueTypes.features}`,
        `Questions: ${issueAnalysis.issueTypes.questions}`,
        `Other: ${issueAnalysis.issueTypes.other}`,
      ],
    },
  ];

  if (issueAnalysis.themes.length > 0) {
    content.push({ h3: "Themes" });
    content.push({
      ul: issueAnalysis.themes.map(theme =>
        `**${theme.name}** (${theme.count} issues)${theme.examples.length > 0 ? `: ${theme.examples.slice(0, 2).join(", ")}` : ""}`
      ),
    });
  }

  content.push(
    { h2: "Activity Tracking" },
    {
      table: {
        headers: ["Metric", "Value"],
        rows: [
          ["First Contribution", activityTracking.firstContribution ?? "N/A"],
          ["Last Contribution", activityTracking.lastContribution ?? "N/A"],
          ["Active Days", String(activityTracking.activeDays)],
          ["Avg Issues/Month", activityTracking.averageIssuesPerMonth.toFixed(1)],
          ["Most Active Month", activityTracking.mostActiveMonth ?? "N/A"],
          ["Contribution Trend", activityTracking.contributionTrend],
        ],
      },
    },
    { h2: "Quality Assessment" },
    {
      table: {
        headers: ["Metric", "Value"],
        rows: [
          ["Quality Score", `${qualityAssessment.qualityScore}/100`],
          ["Resolution Rate", `${qualityAssessment.resolutionRate}%`],
          ["Avg Comments", qualityAssessment.averageComments.toFixed(1)],
          ["Avg Time to Close", qualityAssessment.averageTimeToClose ?? "N/A"],
        ],
      },
    },
    { h3: "Quality Factors" },
    {
      ul: [
        `Detail Level: ${qualityAssessment.qualityFactors.detailLevel}`,
        `Reproducibility Info: ${qualityAssessment.qualityFactors.reproducibilityInfo}`,
        `Label Accuracy: ${qualityAssessment.qualityFactors.labelAccuracy}`,
      ],
    },
    { h2: "Insights" }
  );

  if (insights.strengths.length > 0) {
    content.push({ h3: "Strengths" });
    content.push({ ul: insights.strengths });
  }

  if (insights.areasForImprovement.length > 0) {
    content.push({ h3: "Areas for Improvement" });
    content.push({ ul: insights.areasForImprovement });
  }

  if (insights.recommendations.length > 0) {
    content.push({ h3: "Recommendations" });
    content.push({
      ul: insights.recommendations.map(rec =>
        `**[${rec.priority}] ${rec.category}:** ${rec.suggestion}`
      ),
    });
  }

  content.push(
    { h2: "Metadata" },
    {
      ul: [
        `Analysis Version: ${metadata.analysisVersion}`,
        `Issues Analyzed: ${metadata.issuesAnalyzed}`,
        `Processing Time: ${metadata.processingTimeMs}ms`,
        `Data Range: ${metadata.dataRange.from ?? "N/A"} to ${metadata.dataRange.to ?? "N/A"}`,
      ],
    }
  );

  return json2md(content);
}

async function fetchInsightsJson(request: ContributorInsightsRequest, output?: string): Promise<void> {
  console.log(`\nFetching insights for @${request.username} in ${request.owner}/${request.repo}...\n`);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Error ${response.status}: ${error}`);
    process.exit(1);
  }

  const data = await response.json() as ContributorInsightsResponse;

  if (output) {
    const markdown = formatAsMarkdown(data);
    await Bun.write(output, markdown);
    console.log(`Insights written to ${output}`);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function fetchInsightsStream(request: ContributorInsightsRequest, output?: string): Promise<void> {
  console.log(`\nStreaming insights for @${request.username} in ${request.owner}/${request.repo}...\n`);

  const response = await fetch(`${ENDPOINT}?stream=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Error ${response.status}: ${error}`);
    process.exit(1);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    console.error("No response body");
    process.exit(1);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: ContributorInsightsResponse | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        const eventType = line.slice(6).trim();
        process.stdout.write(`\n[${eventType}] `);
      } else if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              process.stdout.write(parsed.text);
            } else if (parsed.phase) {
              console.log(`Phase: ${parsed.phase}`);
            } else if (parsed.response) {
              finalResponse = parsed.response;
              console.log("\n\nFinal Response:");
              console.log(JSON.stringify(parsed.response, null, 2));
            } else {
              console.log(JSON.stringify(parsed, null, 2));
            }
          } catch {
            process.stdout.write(data);
          }
        }
      }
    }
  }

  console.log("\n");

  if (output && finalResponse) {
    const markdown = formatAsMarkdown(finalResponse);
    await Bun.write(output, markdown);
    console.log(`Insights written to ${output}`);
  }
}

async function main(): Promise<void> {
  const { request, stream, output } = parseArgs();

  try {
    if (stream) {
      await fetchInsightsStream(request, output);
    } else {
      await fetchInsightsJson(request, output);
    }
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    process.exit(1);
  }
}

main();
