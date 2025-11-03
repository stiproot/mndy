import * as d3 from "d3";
import { handleNodeClick, getStateColor } from "./common.fns";

export function buildTidyTreeSvg(data) {
  const width = window.innerWidth;

  const root = d3.hierarchy(data);
  const dx = 10;
  const dy = width / (root.height + 1);

  const tree = d3.tree().nodeSize([dx, dy]);

  root.sort((a, b) => d3.ascending(a.data.id, b.data.id));

  tree(root);

  // Compute the extent of the tree. Note that x and y are swapped here
  // because in the tree layout, x is the breadth, but when displayed, the
  // tree extends right rather than down.
  let x0 = Infinity;
  let x1 = -x0;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  // Compute the adjusted height of the tree.
  const height = x1 - x0 + dx * 4;

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-dy / 3, x0 - dx, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
    .call(d3.zoom().on("zoom", zoomed));

  const g = svg.append("g");

  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(root.links())
    .join("path")
    .attr("stroke", (d) => getStateColor(d.target.data.state))
    .attr(
      "d",
      d3
        .linkHorizontal()
        .x((d) => d.y)
        .y((d) => d.x)
    );

  const node = g
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll()
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  node
    .append("circle")
    .attr("r", 4)
    .attr("fill", (d) => getStateColor(d.data.state))
    .attr("style", "cursor: pointer;")
    .on("click", handleNodeClick);

  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.children ? -6 : 6))
    .attr("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => [
      d.data.id,
      d.data.type,
      d.data.title,
      `Complete: ${d.data.perc_complete}%`
    ])
    .clone(true)
    .lower()
    .attr("stroke", "white");

  function zoomed(event) {
    g.attr("transform", event.transform);
  }

  return svg.node();
}
