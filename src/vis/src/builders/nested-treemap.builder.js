import { getRagColorHex } from "@/services/color.service";
import * as d3 from "d3";

export function buildNestedTreeMapSvg(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const color = (d) => {
    if (d.type !== "Task") return "#FFFFFF";
    return getRagColorHex(d.rag_status);
  };

  const root = d3.treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(19)
    .paddingInner(1)
    .round(true)(d3.hierarchy(data)
      .sum(d => d.risk_impact)
      .sort((a, b) => {
        if (a.value === b.value) {
          return b.data.severity - a.data.severity;
        }
        return b.value - a.value;
      }));

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      // "max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif;"
      "max-width: 100%; height: auto; overflow: hidden; font: 17px sans-serif;"
    );

  const shadowId = `shadow-${Math.random().toString(36).substr(2, 9)}`;
  const nodeUidId = `nodeUid-${Math.random().toString(36).substr(2, 9)}`;
  const clipUidId = `clipUid-${Math.random().toString(36).substr(2, 9)}`;

  svg
    .append("filter")
    .attr("id", shadowId)
    .append("feDropShadow")
    .attr("flood-opacity", 0.3)
    .attr("dx", 0)
    .attr("stdDeviation", 3);

  const node = svg
    .selectAll("g")
    .data(d3.group(root, (d) => d.height))
    .join("g")
    .attr("filter", `url(#${shadowId})`)
    .selectAll("g")
    .data((d) => d[1])
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  const format = d3.format(",d");
  node.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .reverse()
        .map((d) => d.data.title)
        .join("/")}\n${format(d.value)}`
  );

  node
    .filter(d => d.depth > 0)
    .append("rect")
    .attr("id", (d) => (d.nodeUid = nodeUidId).id)
    .attr("fill", (d) => color(d.data))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("style", "cursor:pointer")
    .on("click", (d) => {
      if (d.target && d.target.__data__ && d.target.__data__.data && d.target.__data__.data.ext_url) {
        window.open(d.target.__data__.data.ext_url, "_blank");
      }
    });

  node
    .filter(d => d.depth > 0)
    .attr("id", (d) => (d.clipUid = clipUidId).id)
    .append("use")
    .attr("xlink:href", (d) => d.nodeUid.href);

  node
    .filter(d => d.depth > 0)
    .append("text")
    .attr("clip-path", (d) => d.clipUid)
    .selectAll("tspan")
    // .data((d) => [format(d.value), d.data.type].concat(d.data.title.split(" ")))
    .data((d) =>
      [format(d.value), d.data.type].concat(d.data.title.substring(0, 25))
    )
    .join("tspan")
    .text((d) => d);

  node
    .filter((d) => d.children)
    .selectAll("tspan")
    .attr("dx", 3)
    .attr("y", 13);

  node
    .filter((d) => !d.children)
    .selectAll("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    );

  return svg.node();
}
