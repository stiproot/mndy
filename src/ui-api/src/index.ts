import express from "express";
import cors from "cors";
import { processProcsQry, processProjsQry, processProjQry, processStructQry, processUnitsQry } from "./controllers/qrys";
import { processAzdoProxyCmds, processWorkflowCmd } from "./controllers/cmds/cmds";
import { processPersistProjCmd, processUpdateProjCmd } from "./controllers/cmds/projs.cmds";
import { processExchangeCodeForTokenCmd, processRefreshTokenCmd } from "./controllers/cmds/auth.cmds";
import { runWiql, getWiDetails, getAllTeams, getTeamIterations, getTeamSettings, getTeamFieldValues } from "./controllers/azdo.qrys";
import { validateToken } from "./controllers/cmds/auth.token";
import { Request, Response } from 'express';
require("dotenv").config();

const BASE_URL = "/ui-api";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

// AUTH...
app.post(`${BASE_URL}/cmd/auth/token/exchange`, express.json(), processExchangeCodeForTokenCmd);
app.post(`${BASE_URL}/cmd/auth/token/refresh`, express.json(), processRefreshTokenCmd);

// CMDS...
app.post(`${BASE_URL}/cmd/data/workflows`, express.json(), validateToken, processWorkflowCmd);
app.post(`${BASE_URL}/cmd/data/persist/proj`, express.json(), validateToken, processPersistProjCmd);
app.patch(`${BASE_URL}/cmd/data/update/proj`, express.json(), validateToken, processUpdateProjCmd);
app.post(`${BASE_URL}/cmd/azdo/proxy`, express.json(), validateToken, processAzdoProxyCmds);

// QRYS...
app.post(`${BASE_URL}/qry/data/procs`, express.json(), validateToken, processProcsQry);
app.post(`${BASE_URL}/qry/data/projs`, express.json(), validateToken, processProjsQry);
app.post(`${BASE_URL}/qry/data/proj`, express.json(), validateToken, processProjQry);
app.post(`${BASE_URL}/qry/data/struct`, express.json(), validateToken, processStructQry);
app.post(`${BASE_URL}/qry/data/units`, express.json(), validateToken, processUnitsQry);

// AzDO...
app.post(`${BASE_URL}/ext/qry/data/wiql`, express.json(), validateToken, runWiql);
app.post(`${BASE_URL}/ext/qry/data/wi/details`, express.json(), validateToken, getWiDetails);
app.post(`${BASE_URL}/ext/qry/data/teams`, express.json(), validateToken, getAllTeams);
app.post(`${BASE_URL}/ext/qry/data/team/iterations`, express.json(), validateToken, getTeamIterations);
app.post(`${BASE_URL}/ext/qry/data/team/settings`, express.json(), validateToken, getTeamSettings);
app.post(`${BASE_URL}/ext/qry/data/team/fieldvalues`, express.json(), validateToken, getTeamFieldValues);

// TMP...
app.post(`${BASE_URL}/qry/data/struct/unsafe`, express.json(), processStructQry);
app.post(`${BASE_URL}/qry/data/units/unsafe`, express.json(), processUnitsQry);

// HEALTH...
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
