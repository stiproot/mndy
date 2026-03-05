import * as d3 from "d3";
import { genRndHex } from "@/services/color.service";

const teamColors = {};

function getColorForTeam(team) {
  if (team in teamColors) {
    return teamColors[team];
  } else {
    const color = genRndHex(3);
    teamColors[team] = color;
    return color;
  }
}

export function buildSimplePackedCircleSvg(data) {
  // Specify the dimensions of the chart.
  const width = 928;
  const height = width;
  const margin = 1; // to avoid clipping the root circle stroke

  // Specify the number format for values.
  const format = d3.format(",d");

  // Create the pack layout.
  const pack = d3
    .pack()
    .size([width - margin * 2, height - margin * 2])
    .padding(3);

  // Compute the hierarchy from the JSON data; recursively sum the
  // values for each node; sort the tree by descending value; lastly
  // apply the pack layout.
  const root = pack(
    d3
      .hierarchy(data)
      .sum((d) => d.risk_impact)
      .sort((a, b) => b.risk_impact - a.risk_impact)
  );

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-margin, -margin, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .attr("text-anchor", "middle");

  // Place each node according to the layout’s x and y values.
  const node = svg
    .append("g")
    .selectAll()
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Add a title.
  node.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .map((d) => d.data.title)
        .reverse()
        .join("/")}\n${format(d.risk_impact)}`
  );

  // Add a filled or stroked circle.
  node
    .append("circle")
    .attr("fill", (d) => (d.children ? "#fff" : "#ddd"))
    //.attr("fill", (d) => getColorForTeam(d.data.team))
    .attr("stroke", (d) => getColorForTeam(d.data.area_path))
    //.attr("stroke", (d) => (d.children ? "#bbb" : null))
    .attr("r", (d) => d.r);

  // Add a label to leaf nodes.
  const text = node
    .filter((d) => !d.children && d.r > 10)
    .append("text")
    .attr("clip-path", (d) => `circle(${d.r})`);

  // Add a tspan for each CamelCase-separated word.
  text
    .selectAll()
    .data((d) => d.data.title.split(/(?=[A-Z][a-z])|\s+/g))
    .join("tspan")
    .attr("x", 0)
    .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
    .text((d) => d);

  // Add a tspan for the node’s value.
  text
    .append("tspan")
    .attr("x", 0)
    .attr(
      "y",
      (d) => `${d.data.title.split(/(?=[A-Z][a-z])|\s+/g).length / 2 + 0.35}em`
    )
    .attr("fill-opacity", 0.7)
    .text((d) => format(d.risk_impact));

  return svg.node();
}
