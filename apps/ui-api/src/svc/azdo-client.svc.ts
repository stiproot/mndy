import { Effect, Schedule, Duration } from "effect";
import { AzdoConfig } from "../config";
import { HttpClientSvc } from "./http-client.svc";
import { AzdoApiError } from "../errors";

const DEFAULT_API_VERSION = "api-version=7.1";

const retrySchedule = Schedule.exponential(Duration.millis(500)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(3))
);

export class AzdoClientSvc extends Effect.Service<AzdoClientSvc>()("AzdoClientSvc", {
  effect: Effect.gen(function* () {
    const config = yield* AzdoConfig;
    const httpClient = yield* HttpClientSvc;

    const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
    const workItemBaseUrl = `https://dev.azure.com/${config.organization}/${config.project}/_apis/wit`;
    const teamsBaseUrl = `https://dev.azure.com/${config.organization}/_apis/projects/${config.project}`;

    const buildAuthHeaders = (): Record<string, string> => ({
      Authorization: `Basic ${config.apiKey}`,
    });

    return {
      runWiql: <T>(wiql: string): Effect.Effect<T | null, AzdoApiError> => {
        const url = `/wiql?${DEFAULT_API_VERSION}`;
        return httpClient
          .post<T, { query: string }>(workItemBaseUrl, url, { query: wiql }, buildAuthHeaders())
          .pipe(
            Effect.retry(retrySchedule),
            Effect.catchAll((error) =>
              Effect.fail(
                new AzdoApiError({
                  message: "Failed to execute WIQL query",
                  cause: error,
                })
              )
            ),
            Effect.withSpan("AzdoClientSvc.runWiql")
          );
      },

      getWorkItemDetails: <T>(id: string | number): Effect.Effect<T | null, AzdoApiError> => {
        const url = `/workitems/${id}?$expand=all&${DEFAULT_API_VERSION}`;
        return httpClient.get<T>(workItemBaseUrl, url, buildAuthHeaders()).pipe(
          Effect.retry(retrySchedule),
          Effect.catchAll((error) =>
            Effect.fail(
              new AzdoApiError({
                message: "Failed to get work item details",
                workItemId: String(id),
                cause: error,
              })
            )
          ),
          Effect.withSpan("AzdoClientSvc.getWorkItemDetails", {
            attributes: { workItemId: String(id) },
          })
        );
      },

      getAllTeams: <T>(): Effect.Effect<T[], AzdoApiError> => {
        const url = `/teams?$top=500&${DEFAULT_API_VERSION}`;
        return httpClient.get<{ value: T[] }>(teamsBaseUrl, url, buildAuthHeaders()).pipe(
          Effect.map((response) => response.value ?? []),
          Effect.retry(retrySchedule),
          Effect.catchAll((error) =>
            Effect.fail(
              new AzdoApiError({
                message: "Failed to get all teams",
                cause: error,
              })
            )
          ),
          Effect.withSpan("AzdoClientSvc.getAllTeams")
        );
      },

      getTeamIterations: <T>(teamName: string): Effect.Effect<T[], AzdoApiError> => {
        const url = `/${teamName}/_apis/work/teamsettings/iterations/?${DEFAULT_API_VERSION}`;
        return httpClient.get<{ value: T[] }>(baseUrl, url, buildAuthHeaders()).pipe(
          Effect.map((response) => response.value ?? []),
          Effect.retry(retrySchedule),
          Effect.catchAll((error) =>
            Effect.fail(
              new AzdoApiError({
                message: "Failed to get team iterations",
                cause: error,
              })
            )
          ),
          Effect.withSpan("AzdoClientSvc.getTeamIterations", {
            attributes: { teamName },
          })
        );
      },

      getTeamSettings: <T>(teamName: string): Effect.Effect<T, AzdoApiError> => {
        const url = `/${teamName}/_apis/work/teamsettings?${DEFAULT_API_VERSION}`;
        return httpClient.get<T>(baseUrl, url, buildAuthHeaders()).pipe(
          Effect.retry(retrySchedule),
          Effect.catchAll((error) =>
            Effect.fail(
              new AzdoApiError({
                message: "Failed to get team settings",
                cause: error,
              })
            )
          ),
          Effect.withSpan("AzdoClientSvc.getTeamSettings", {
            attributes: { teamName },
          })
        );
      },

      getTeamFieldValues: <T>(teamName: string): Effect.Effect<T, AzdoApiError> => {
        const url = `/${teamName}/_apis/work/teamsettings/teamfieldvalues/?${DEFAULT_API_VERSION}`;
        return httpClient.get<T>(baseUrl, url, buildAuthHeaders()).pipe(
          Effect.retry(retrySchedule),
          Effect.catchAll((error) =>
            Effect.fail(
              new AzdoApiError({
                message: "Failed to get team field values",
                cause: error,
              })
            )
          ),
          Effect.withSpan("AzdoClientSvc.getTeamFieldValues", {
            attributes: { teamName },
          })
        );
      },
    };
  }),
  dependencies: [HttpClientSvc.Default],
}) {}
