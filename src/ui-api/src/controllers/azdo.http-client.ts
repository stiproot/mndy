import { HttpClient } from "./http-client";

const AZDO_ORGANIZATION = process.env.AZDO_ORGANIZATION || "your-organization";
const AZDO_PROJECT = process.env.AZDO_PROJECT || "your-project";

const BASE_URL = `https://dev.azure.com/${AZDO_ORGANIZATION}/${AZDO_PROJECT}`;
const WORK_ITEM_BASE_URL = `https://dev.azure.com/${AZDO_ORGANIZATION}/${AZDO_PROJECT}/_apis/wit`;
const TEAMS_BASE_URL = `https://dev.azure.com/${AZDO_ORGANIZATION}/_apis/projects/${AZDO_PROJECT}`;

const DEFAULT_API_VERSION = "api-version=7.1";
const API_KEY = () => process.env.AZDO_API_KEY;

const httpClient = new HttpClient(BASE_URL);
const workItemHttpClient = new HttpClient(WORK_ITEM_BASE_URL);
const teamsHttpClient = new HttpClient(TEAMS_BASE_URL);

const buildHeaders = () => { return { Authorization: `Basic ${API_KEY()}` }; };

const QUERY_ROUTE = "queries";
const WIQL_ROUTE = "wiql";
const WI_ROUTE = "workitems";
const TEAMS_ROUTE = "teams";
const ITERATIONS_ROUTE = "iterations";
const TEAM_FIELD_VALUES_ROUTE = "teamfieldvalues";
const TEAM_SETTINGS_ROUTE = "teamsettings";

const buildWiqlUrl = () => `/${WIQL_ROUTE}?${DEFAULT_API_VERSION}`;
const buildFilterQueriesUrl = (filter: any) =>
  `/${QUERY_ROUTE}?$filter=${filter}&$expand=minimal&${DEFAULT_API_VERSION}`;

const buildGetWiDetailsUrl = (id: string | number) =>
  `/${WI_ROUTE}/${id}?$expand=all&${DEFAULT_API_VERSION}`;

const buildGetAllTeamsUrl = () =>
  `/${TEAMS_ROUTE}?$top=500&${DEFAULT_API_VERSION}`;

const buildGetTeamIterationsUrl = (team: string) =>
  `/${team}/_apis/work/${TEAM_SETTINGS_ROUTE}/${ITERATIONS_ROUTE}/?${DEFAULT_API_VERSION}`;

const buildGetTeamSettingsUrl = (team: string) =>
  `/${team}/_apis/work/${TEAM_SETTINGS_ROUTE}?${DEFAULT_API_VERSION}`;

const buildGetTeamFieldValuesUrl = (team: string) =>
  `/${team}/_apis/work/${TEAM_SETTINGS_ROUTE}/${TEAM_FIELD_VALUES_ROUTE}/?${DEFAULT_API_VERSION}`;


export class AzdoHttpClient {

  async runWiql(wiql: string) {
    const headers = buildHeaders();
    const url = buildWiqlUrl();
    try {
      const response = await workItemHttpClient.post(url, { query: wiql }, headers);
      return response;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async filterQueries(filter: any) {
    if (filter === "") {
      console.warn("No query id or name provided");
      return [];
    }

    const headers = buildHeaders();
    const url = buildFilterQueriesUrl(filter);

    try {
      const response = await workItemHttpClient.get(url, headers);
      return response.value;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getWiDetails(id: string | number) {
    if (!id) {
      console.warn("No id provided");
      return null;
    }

    const headers = buildHeaders();
    const url = buildGetWiDetailsUrl(id);

    try {
      const resp = await workItemHttpClient.get(url, headers);
      return resp;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getAllTeams() {
    const headers = buildHeaders();
    const url = buildGetAllTeamsUrl();

    try {
      const resp = await teamsHttpClient.get(url, headers);
      return resp.value;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getTeamIterations(teamName: string) {
    const headers = buildHeaders();
    const url = buildGetTeamIterationsUrl(teamName);

    try {
      const resp = await httpClient.get(url, headers);
      return resp.value;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getTeamSettings(teamName: string) {
    const headers = buildHeaders();
    const url = buildGetTeamSettingsUrl(teamName);

    try {
      const resp = await httpClient.get(url, headers);
      return resp;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  async getTeamFieldValues(teamName: string) {
    const headers = buildHeaders();
    const url = buildGetTeamFieldValuesUrl(teamName);

    try {
      const resp = await httpClient.get(url, headers);
      return resp;
    } catch (error) {
      console.log(error);
      return {};
    }
  }
}
