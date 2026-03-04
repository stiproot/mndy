# TODO

Data Ingestion Agent
↓
Performance Analysis Agent
↓
Strategy Agent
↓
Reporting Agent

---

Purpose: pull data from the ad platforms.

APIs required:

Meta

Meta Marketing API

Google

Google Ads API

Analytics

GA4 Data API

Optional but very powerful:

Shopify

Shopify Admin API

Example data pipeline:

Meta Ads API → campaign performance
Google Ads API → keyword + campaign data
GA4 API → funnel metrics
Shopify → revenue + AOV

The agent standardises the data into one dataset.

Example table structure:

| Date | Channel | Campaign | Spend | CTR | CPC | Conversions | Revenue | ROAS |

3. Performance Analysis Agent

This agent identifies performance patterns.

Tasks:

detect budget waste

detect creative fatigue

detect audience saturation

identify scaling opportunities

Example analysis rules:

CTR < 1% → weak creative
Frequency > 3.5 → audience fatigue
CPA 2x account average → budget waste
ROAS > 3 → scaling opportunity

4. Strategy Agent

This is where Claude or GPT excels.

The strategy agent decides:

budget reallocation

campaign restructuring

creative testing roadmap

audience expansion

Example output:

Increase budget on Retargeting Campaign by 30%

Pause Prospecting Campaign 3 due to CTR decline.

Launch new creatives for Advantage+ campaign.

5. Reporting Agent

Outputs a structured report.

Example daily output:

Account Health
ROAS stable but CPC rising.

Budget Waste
Campaign “Prospecting 4”.

Scaling Opportunities
Retargeting campaign with ROAS 6.1.

Action Plan
Refresh creatives on prospecting campaigns.

6. Suggested Stack (for your developer)

Backend:

Python
FastAPI

AI layer:

Claude API
or
OpenAI API

Data:

PostgreSQL
or
BigQuery

Automation:

Airflow
or
cron jobs

7. Daily Workflow

Your AI system should run something like:

Every morning
↓
Pull ad data
↓
Analyse performance
↓
Generate report
↓
Send report via Slack / email
8. Smart Features to Ask Your Developer For

These are very valuable:

Budget anomaly detection

Alert if:

CPA spikes
ROAS drops
Spend increases abnormally
Creative fatigue detection

Detect:

CTR drop
CPC increase
Frequency rise
Scaling alerts

Example:

Campaign exceeding ROAS target
Recommend +20% budget increase

9. Optional Advanced Agent (Very Powerful)

A Creative Agent.

It analyses winning ads and suggests:

new hooks

new headlines

new angles

This helps generate new ads automatically.

10. What You Should Ask Your Developer

Send them something like this:

Build a multi-agent system that pulls performance data from Meta Ads, Google Ads and GA4, analyses campaign performance, detects inefficiencies and scaling opportunities, and produces a daily marketing performance report with actionable recommendations.

---

Agent 1: Data Ingestion Agent

Job: Pull data daily from:

Meta Marketing API

Google Ads API

GA4 Data API
(Optional: Shopify Admin API)

Outputs (tables):

meta_daily (campaign + adset + ad)

google_daily (campaign + keyword optional)

ga4_daily (source/campaign + funnel events)

unified_daily (standardised rows across channels)

Key requirement: store history (daily snapshots), not “latest only”.

Agent 2: KPI Normaliser Agent

Job: Clean and standardise metrics so analysis is consistent.

It should:

unify naming (campaign names, channel names)

standardise currency + date timezone (Africa/Johannesburg)

map conversions properly:

Meta “purchase” / “lead” actions → conversions

Google conversions → conversions

GA4 purchases → purchases

compute derived metrics consistently:

CPA, ROAS, CVR, AOV (if Shopify/GA4 revenue exists)

dedupe / handle missing values safely

Output: one clean table the other agents can trust:

fact_marketing_daily

Agent 3: Performance Detective Agent

Job: Detect what changed + what’s wrong (alerts + diagnosis).

It should run rules + light stats like:

ROAS down WoW / DoD

CPA up vs 7-day average

CTR down + CPC up (creative fatigue signal)

frequency above threshold (saturation)

spend up but conversions flat (waste)

GA4 funnel drop-offs spiking

Outputs:

anomalies_daily (what changed, severity, where)

diagnosis_notes (short bullets with supporting metrics)

This is the agent that makes the system feel “smart”.

Agent 4: Marketing Director Agent (LLM)

Job: Turn the data + anomalies into decisions.

Inputs:

fact_marketing_daily

anomalies_daily

your targets (ROAS goal / CPA goal, budgets, geo, business model)

Outputs (your report):

campaigns to scale / hold / cut

budget reallocation suggestion (by channel + by campaign)

creative actions (refresh / new hooks / new formats)

audience actions (expand / exclude / new LALs / retargeting windows)

funnel actions (landing page vs checkout vs product page)

Deliverables:

daily summary (short)

weekly strategy report (longer)

---

Minimal output format you should require (every day)

Tell the dev the system must produce:

Top 3 wins (what’s working + why)

Top 3 problems (what’s wasting money + proof)

Top 5 actions (ranked, specific, doable)

Budget moves (R amounts or % shifts)

---

Because you run multiple brands and campaigns, I would strongly recommend adding a Campaign Classification Agent (it automatically identifies whether a campaign is awareness, traffic, or conversion).
