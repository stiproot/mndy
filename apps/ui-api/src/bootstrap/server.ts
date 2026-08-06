import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Configs } from "../config";

// Handlers
import {
  processProcsQry,
  processProjsQry,
  processProjQry,
  processStructQry,
  processUnitsQry,
} from "../handlers/query.handlers";
import {
  processWorkflowCmd,
  processAzdoProxyCmds,
  processPersistProjCmd,
  processUpdateProjCmd,
} from "../handlers/command.handlers";
import {
  processExchangeCodeForTokenCmd,
  processRefreshTokenCmd,
  processDevAuthCmd,
} from "../handlers/auth.handlers";
import {
  runWiql,
  getWiDetails,
  getAllTeams,
  getTeamIterations,
  getTeamSettings,
  getTeamFieldValues,
} from "../handlers/azdo.handlers";
import {
  handleClientUpdateSubscription,
  getDaprSubscriptions,
} from "../handlers/subscription.handlers";
import {
  listConversations,
  getConversation,
  createConversation,
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  assignLabelsToMessage,
  removeLabelFromMessage,
} from "../handlers/chat.handlers";

// Middleware
import { validateToken } from "../middleware/auth.middleware";

const BASE_URL = "/ui-api";

/**
 * Creates and configures the Express application with all routes.
 */
export const createServer = (): Express => {
  const app = express();
  app.use(cors());

  // AUTH
  app.post(
    `${BASE_URL}/cmd/auth/token/exchange`,
    express.json(),
    processExchangeCodeForTokenCmd
  );
  app.post(
    `${BASE_URL}/cmd/auth/token/refresh`,
    express.json(),
    processRefreshTokenCmd
  );
  app.post(`${BASE_URL}/cmd/auth/dev`, express.json(), processDevAuthCmd);

  // COMMANDS
  app.post(
    `${BASE_URL}/cmd/data/workflows`,
    express.json(),
    validateToken,
    processWorkflowCmd
  );
  app.post(
    `${BASE_URL}/cmd/data/persist/proj`,
    express.json(),
    validateToken,
    processPersistProjCmd
  );
  app.patch(
    `${BASE_URL}/cmd/data/update/proj`,
    express.json(),
    validateToken,
    processUpdateProjCmd
  );
  app.post(
    `${BASE_URL}/cmd/azdo/proxy`,
    express.json(),
    validateToken,
    processAzdoProxyCmds
  );

  // QUERIES
  app.post(
    `${BASE_URL}/qry/data/procs`,
    express.json(),
    validateToken,
    processProcsQry
  );
  app.post(
    `${BASE_URL}/qry/data/projs`,
    express.json(),
    validateToken,
    processProjsQry
  );
  app.post(
    `${BASE_URL}/qry/data/proj`,
    express.json(),
    validateToken,
    processProjQry
  );
  app.post(
    `${BASE_URL}/qry/data/struct`,
    express.json(),
    validateToken,
    processStructQry
  );
  app.post(
    `${BASE_URL}/qry/data/units`,
    express.json(),
    validateToken,
    processUnitsQry
  );

  // AZDO
  app.post(
    `${BASE_URL}/ext/qry/data/wiql`,
    express.json(),
    validateToken,
    runWiql
  );
  app.post(
    `${BASE_URL}/ext/qry/data/wi/details`,
    express.json(),
    validateToken,
    getWiDetails
  );
  app.post(
    `${BASE_URL}/ext/qry/data/teams`,
    express.json(),
    validateToken,
    getAllTeams
  );
  app.post(
    `${BASE_URL}/ext/qry/data/team/iterations`,
    express.json(),
    validateToken,
    getTeamIterations
  );
  app.post(
    `${BASE_URL}/ext/qry/data/team/settings`,
    express.json(),
    validateToken,
    getTeamSettings
  );
  app.post(
    `${BASE_URL}/ext/qry/data/team/fieldvalues`,
    express.json(),
    validateToken,
    getTeamFieldValues
  );

  // UNSAFE (dev/debug endpoints without auth)
  app.post(
    `${BASE_URL}/qry/data/struct/unsafe`,
    express.json(),
    processStructQry
  );
  app.post(
    `${BASE_URL}/qry/data/units/unsafe`,
    express.json(),
    processUnitsQry
  );

  // DAPR SUBSCRIPTIONS
  app.get("/dapr/subscribe", getDaprSubscriptions);
  app.post(
    Configs.DAPR_SUBSCRIPTION_ROUTE,
    express.json(),
    handleClientUpdateSubscription
  );

  // CHAT - Conversations
  app.get(
    `${BASE_URL}/chat/conversations`,
    validateToken,
    listConversations
  );
  app.get(
    `${BASE_URL}/chat/conversations/:id`,
    validateToken,
    getConversation
  );
  app.post(
    `${BASE_URL}/chat/conversations`,
    express.json(),
    validateToken,
    createConversation
  );

  // CHAT - Labels
  app.get(
    `${BASE_URL}/chat/labels`,
    validateToken,
    listLabels
  );
  app.post(
    `${BASE_URL}/chat/labels`,
    express.json(),
    validateToken,
    createLabel
  );
  app.put(
    `${BASE_URL}/chat/labels/:id`,
    express.json(),
    validateToken,
    updateLabel
  );
  app.delete(
    `${BASE_URL}/chat/labels/:id`,
    validateToken,
    deleteLabel
  );

  // CHAT - Message Labels
  app.post(
    `${BASE_URL}/chat/messages/:messageId/labels`,
    express.json(),
    validateToken,
    assignLabelsToMessage
  );
  app.delete(
    `${BASE_URL}/chat/messages/:messageId/labels/:labelId`,
    validateToken,
    removeLabelFromMessage
  );

  // HEALTH
  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).send("OK");
  });

  return app;
};
