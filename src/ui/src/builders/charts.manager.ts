import { filterByType } from "../fns/data.fns";

import { buildNestedTreeMapSvg } from "./nested-treemap.builder.js";
import { buildForceDirectedTreeSvg } from "./force-directed-tree.builder.js";
import { buildPackedCircleSvg } from "./packed-circle.builder.js";
import { buildSimplePackedCircleSvg } from "./simple-packed-circle.builder.js";
import { buildSunburstSvg } from "./sunburst.builder.js";
import { buildZoomableSunburstSvg } from "./zoomable-sunburst.builder.js";
import { buildTidyTreeSvg } from "./tidy-tree.builder.js";
import { buildBubbleChartSvg } from "./bubble-chart.builder.js";
import { buildRadialClusterSvg } from "./radial-cluster.builder.js";
import { buildSequencesSunburstSvg } from "./sequences-sunburst.builder.js";
import { buildGridSvg } from "./grid.builder.js";
import { buildMldlcSvg } from "./mldlc.builder.js";
import { buildSdlcSvg } from "./sdlc.builder.js";

export function buildNestedTreeMap(data: any) {
  const tasks = filterByType(data, "Task");
  const root = {
    id: "",
    type: "",
    title: "project",
    children: tasks,
  };
  const svg = buildNestedTreeMapSvg(root);
  return svg;
}

export function buildForceDirectedTree(data: any) {
  const root = data;
  root.title = "root";
  return buildForceDirectedTreeSvg(root);
}

export function buildPackedCircle(data: any) {
  const root = data;
  root.title = "root";
  return buildPackedCircleSvg(root);
}

export function buildSimplePackedCircle(data: any) {
  const root = data;
  root.title = "root";
  root.id = 0;
  return buildSimplePackedCircleSvg(root);
}

export function buildSunburst(data: any) {
  const root = data;
  root.title = "root";
  return buildSunburstSvg(root);
}

export function buildTidyTree(data: any) {
  const root = data.children[0];
  return buildTidyTreeSvg(root);
}

export function buildZoomableSunburst(data: any) {
  const root = data;
  root.title = "root";
  root.id = 0;
  return buildZoomableSunburstSvg(root);
}

export function buildBubbleChart(data: any) {
  const tasks = filterByType(data, "Task");
  return buildBubbleChartSvg(tasks);
}

export function buildRadialCluster(data: any) {
  const root = data;
  root.title = "";
  root.id = 0;
  return buildRadialClusterSvg(root);
}

export function buildSequencesSunburst(data: any) {
  const root = data;
  root.title = "root";
  root.id = 0;
  return buildSequencesSunburstSvg(root);
}

export function buildGrid(data: any) {
  // const tasks = filterByType(data, "Task");
  const svg = buildGridSvg(data);
  return svg;
}

export function buildMldlc(data: any) {
  const svg = buildMldlcSvg(data);
  return svg;
}

export function buildSdlc(data: any) {
  const svg = buildSdlcSvg(data);
  return svg;
}