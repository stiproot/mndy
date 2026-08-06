import { Effect } from "effect";
import { Response } from "express";
import { AzdoClientSvc, AppLayer } from "../svc";
import { IReq, IQry } from "../types";

// Run WIQL query
export const runWiql = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { ql } = req.body?.qryData ?? {};

  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.runWiql(ql!);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Get work item details
export const getWiDetails = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { id } = req.body.qryData;

  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.getWorkItemDetails(id!);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Get all teams
export const getAllTeams = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.getAllTeams();
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Get team iterations
export const getTeamIterations = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { teamName } = req.body.qryData;

  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.getTeamIterations(teamName!);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Get team settings
export const getTeamSettings = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { teamName } = req.body.qryData;

  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.getTeamSettings(teamName!);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Get team field values
export const getTeamFieldValues = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { teamName } = req.body.qryData;

  const effect = Effect.gen(function* () {
    const azdoSvc = yield* AzdoClientSvc;
    return yield* azdoSvc.getTeamFieldValues(teamName!);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};
