import {
  buildForceDirectedTree,
  buildPackedCircle,
  buildSunburst,
  buildZoomableSunburst,
  buildBubbleChart,
  buildRadialCluster,
  buildSequencesSunburst,
  buildSimplePackedCircle,
  buildGrid,
  buildMldlc,
  buildSdlc,
  buildTidyTree
} from "@/builders/charts.manager";
import { ChartTypes } from "@/types/chart-types";

export const DLC_TYPES = {
  SDLC: "SDLC",
  MLDLC: "MLDLC"
}

export const CHART_TYPE_TO_BUILDER_HASH = {
  [ChartTypes.PACKED_CIRCLE]: buildPackedCircle,
  [ChartTypes.SUNBURST]: buildSunburst,
  [ChartTypes.TIDY_TREE]: buildTidyTree,
  [ChartTypes.FORCE_DIRECTED_TREE]: buildForceDirectedTree,
  [ChartTypes.ZOOMABLE_SUNBURST]: buildZoomableSunburst,
  [ChartTypes.BUBBLE_CHART]: buildBubbleChart,
  [ChartTypes.RADIAL_CLUSTER]: buildRadialCluster,
  [ChartTypes.SEQUENCES_SUNBURST]: buildSequencesSunburst,
  [ChartTypes.SIMPLE_PACKED_CIRCLE]: buildSimplePackedCircle,
  [ChartTypes.MLDLC]: buildMldlc,
  [ChartTypes.SDLC]: buildSdlc,
};

export const getChartSvgBuilder = (chartType: ChartTypes): CallableFunction => CHART_TYPE_TO_BUILDER_HASH[chartType];

export const CHART_TYPES_LIST = [
  { id: ChartTypes.TIDY_TREE, description: "Tidy Tree", in_progress: false },
  { id: "expandable-tree", description: "Expandable Tree", in_progress: false },
  { id: "nested-treemap", description: "Nested Treemap", in_progress: false },
  { id: ChartTypes.PACKED_CIRCLE, description: "Packed Circles", in_progress: false },
  { id: ChartTypes.RADIAL_CLUSTER, description: "Radial Cluster", in_progress: false },
  { id: ChartTypes.MLDLC, description: "MLDLC", in_progress: true },
  { id: ChartTypes.SDLC, description: "SDLC", in_progress: true },
  {
    id: "force-directed-tree",
    description: "Force directed tree",
    in_progress: true,
  },
  {
    id: "zoomable-sunburst",
    description: "Zoomable Sunburst",
    in_progress: true,
  },
];

export const CHART_TYPE_RGB_COLOR_HASH = {
  "nested-treemap": "#99ad57",
  "tidy-tree": "#3886ba",
  "radial-cluster": "rgb(182, 139, 199)",
  "packed-circle": "rgb(91, 142, 145)",
  sunburst: "rgb(249, 85, 88)",
  "force-directed-tree": "#d1b464",
  "zoomable-sunburst": "rgb(94, 167, 181)",
  "bubble-chart": "rgb(155, 119, 191)",
  "sequences-sunburst": "rgb(242, 211, 124)",
  "simple-packed-circle": "rgb(174, 201, 155)",
  "sdlc": "#77bf81",
  "mldlc": "rgb(132, 196, 167)",
  "expandable-tree": "rgb(155, 119, 191)",
};

export const CHARTS_SUPPORTING_FILTERS = [
  ChartTypes.TIDY_TREE,
  ChartTypes.RADIAL_CLUSTER,
];