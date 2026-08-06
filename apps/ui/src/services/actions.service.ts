import { ActionTypes } from "@/types/action-types";

export const ACTIONS = [
  {
    id: ActionTypes.REFRESH_PROJ_TREE,
    title: "refresh",
    description: "Refresh Project State",
    color: "#000000",
  },
  {
    id: "UPDATE_PROGRAMME_PERC_COMPLETE",
    title: "update",
    wi_type: "Programme",
    description: "Update Programme % Complete",
    color: "#b9c2c9",
  },
  {
    id: "UPDATE_LARGE_PROJECT_PERC_COMPLETE",
    title: "update",
    wi_type: "Large Project",
    description: "Update Large Project % Complete",
    color: "#4fa5c4",
  },
  {
    id: "UPDATE_MEDIUM_PROJECT_PERC_COMPLETE",
    title: "update",
    wi_type: "Medium Project",
    description: "Update Medium Project % Complete",
    color: "#4fa5c4",
  },
  {
    id: "CLOSE_STALE_EPICS",
    title: "close",
    wi_type: "Epic",
    description: "Close Stale Epics",
    color: "#d19580",
    in_progress: true,
  },
  {
    id: "CLOSE_STALE_FEATURES",
    title: "close",
    wi_type: "Feature",
    description: "Close Stale Features",
    color: "#8c78b3",
    in_progress: true,
  },
  {
    id: "CLOSE_STALE_USER_STORIES",
    title: "close",
    wi_type: "User Story",
    description: "Close Stale User Stories",
    color: "#2f74ad",
    in_progress: true,
  },
];

export const WORK_ITEM_CHILD_RELATIONSHIPS = {
  "Programme": ["Programme", "Large Project", "Medium Project", "Initiative", "Epic", "Feature", "User Story", "Task"],
  "Large Project": ["Large Project", "Initiative", "Epic", "Feature", "User Story", "Task"],
  "Medium Project": ["Medium Project", "Initiative", "Epic", "Feature", "User Story", "Task"],
  "Initiative": ["Initiative", "Epic", "Feature", "User Story", "Task"],
  "Epic": ["Epic", "Feature", "User Story", "Task"],
  "Feature": ["Feature", "User Story", "Task"],
  "User Story": ["User Story", "Task"],
}