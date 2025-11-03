import * as d3 from "d3";
import { handleNodeClick, getStateColor } from "./common.fns";

export function buildRadialClusterSvg(data) {
  // const width = window.innerWidth;
  // const height = window.innerHeight;

  // Specify the chart’s dimensions.
  const width = 928;
  const height = width;
  const cx = width * 0.5; // adjust as needed to fit
  const cy = height * 0.54; // adjust as needed to fit
  const radius = Math.min(width, height) / 2 - 80;

  // Create a radial cluster layout. The layout’s first dimension (x)
  // is the angle, while the second (y) is the radius.
  const tree = d3
    .cluster()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  // Sort the tree and apply the layout.
  const root = tree(
    d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.title, b.data.title))
  );

  // Creates the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-cx, -cy, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .call(d3.zoom().on("zoom", zoomed));

  const g = svg.append("g");

  // Append links.
  g.append("g")
    .attr("fill", "none")
    //.attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(root.links())
    .join("path")
    .attr(
      "d",
      d3
        .linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)
    )
    .attr("stroke", (d) => getStateColor(d.target.data.state));

  // Append nodes.
  g.append("g")
    .selectAll()
    .data(root.descendants())
    .join("circle")
    .attr(
      "transform",
      (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    //.attr("fill", (d) => (d.children ? "#555" : "#999"))
    .attr("fill", (d) => getStateColor(d.data.state))
    .attr("r", 2.5)
    .on("click", handleNodeClick)
    .attr("style", "cursor: pointer;");

  // Append labels.
  g.append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll()
    .data(root.descendants())
    .join("text")
    .attr(
      "transform",
      (d) =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr("text-anchor", (d) =>
      d.x < Math.PI === !d.children ? "start" : "end"
    )
    .attr("paint-order", "stroke")
    .attr("stroke", "white")
    .attr("fill", "currentColor")
    .text((d) => d.data.title);

  function zoomed(event) {
    g.attr("transform", event.transform);
  }

  return svg.node();
}
