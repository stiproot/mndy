import { Response } from 'express';
import { IReq, IQry } from './types';
import { AzdoHttpClient } from "./azdo.http-client";

const azdoClient = new AzdoHttpClient();

export const runWiql = async (req: IReq<IQry>, res: Response) => {
  try {
    const { ql } = req.body?.qryData;
    const resp = await azdoClient.runWiql(ql);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const filterQueries = async (req: IReq<IQry>, res: Response) => {
  try {
    const resp = await azdoClient.filterQueries(req.body?.qryData);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const getWiDetails = async (req: IReq<IQry>, res: Response) => {
  try {
    const { id } = req.body.qryData;
    const resp = await azdoClient.getWiDetails(id);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const getAllTeams = async (req: IReq<IQry>, res: Response) => {
  try {
    const resp = await azdoClient.getAllTeams();
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const getTeamIterations = async (req: IReq<IQry>, res: Response) => {
  try {
    const { teamName } = req.body.qryData;
    const resp = await azdoClient.getTeamIterations(teamName);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
}

export const getTeamSettings = async (req: IReq<IQry>, res: Response) => {
  try {
    const { teamName } = req.body.qryData;
    const resp = await azdoClient.getTeamSettings(teamName);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
}

export const getTeamFieldValues = async (req: IReq<IQry>, res: Response) => {
  try {
    const { teamName } = req.body.qryData;
    const resp = await azdoClient.getTeamFieldValues(teamName);
    res.json(resp);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
}