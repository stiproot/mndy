// import { sample_data } from "./nested-treemap-data.js";

const min = 1;
const max = 15;
const randomInteger = () => Math.floor(Math.random() * (max - min + 1)) + min;
const randomTitle = () => Math.random().toString(36).substr(2, 9);
const enrichNode = (n) => {
  if (n["type"] === "Task" && !n["risk_weight"]) {
    n.risk_weight = randomInteger();
  }

  if (n.children.length > 0) {
    n.children.forEach((c) => enrichNode(c));
  }
};

export function buildNestedTreeMap(_data, container) {
  _data.forEach((n) => {
    enrichNode(n);
  });

  const data = _data[0];
  data.title = "root";
  // const data = sample_data[0];
  const width = window.innerWidth;
  // const height = 1500; //window.innerHeight;
  const height = window.innerHeight;

  // const color = d3.scaleSequential([8, 0], d3.interpolateMagma);
  const color = d3
    .scaleLinear()
    .domain([0, max / 2, max])
    .range(["#FFFFFF", "#268BD2", "#DA3637"]);

  // Create the treemap layout.
  const treemapFn = d3
    .treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(19)
    .paddingInner(1)
    .round(true);

  const hierachy = d3
    .hierarchy(data)
    .sum((d) => d.risk_weight)
    .sort((a, b) => b.value - a.value);

  // console.log("hierachy", hierachy);

  const root = treemapFn(hierachy);

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif;"
    );

  // Generate unique IDs for filters and clipPaths
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
    .append("rect")
    .attr("id", (d) => (d.nodeUid = nodeUidId).id)
    // .attr("fill", (d) => color(d.height))
    .attr("fill", (d) => color(d.data.risk_weight || 0))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  node
    .append("clipPath")
    .attr("id", (d) => (d.clipUid = clipUidId).id)
    .append("use")
    .attr("xlink:href", (d) => d.nodeUid.href);

  node
    .append("text")
    .attr("clip-path", (d) => d.clipUid)
    .selectAll("tspan")
    .data((d) => [format(d.value), d.data.type].concat(d.data.title.split(" ")))
    .join("tspan")
    // .attr("fill-opacity", (d, i, nodes) =>
    //   i === nodes.length - 1 ? 0.7 : null
    // )
    // .attr("fill", (d) => color(d.depth))
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

  container.append(svg.node());
}
