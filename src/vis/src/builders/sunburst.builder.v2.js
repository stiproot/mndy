import * as d3 from "d3";

function buildDimensions() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = 350;

  const dims = { r: r, w: w, h: h };

  return dims;
}

export function buildSunburstV2Svg(data) {
  const dims = buildDimensions();

  // Specify the chart’s approximate radius (it will be adjusted at the end).
  const width = dims.w;
  const height = dims.h;
  const radius = dims.r;

  // Prepare the layout.
  const partition = (data) =>
    d3.partition().size([2 * Math.PI, radius])(
      d3
        .hierarchy(data)
        .sum((d) => d.remaining_work || 0 + d.original_estimate) // Use sum of remaining work and original estimate as the value
        .sort((a, b) => b.value - a.value)
    );

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius / 2)
    .innerRadius((d) => radius - d.y1) // Invert inner and outer radius to represent completion percentage
    .outerRadius((d) => radius - d.y0 - 1); // Adjusted outer radius

  const root = partition(data);

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`);

  // Add an arc for each element, with a title for tooltips.
  const format = d3.format(",d");
  svg
    .append("g")
    .attr("fill-opacity", 0.6)
    .selectAll("path")
    .data(root.descendants().filter((d) => d.depth))
    .join("path")
    .attr("fill", (d) => {
      // const completionPercentage =
      //   (d.data.original_estimate - d.value) / d.data.original_estimate;
      // const completedColor = d3.interpolateTurbo(completionPercentage); // Use any color scale you prefer
      // const remainingColor = d3.color(completedColor).darker(0.3); // Create a dull shade of the completed color
      return `url(#gradient${d.data.title.replace(/\s/g, "")})`;
    })
    .attr("d", arc)
    .append("title")
    .text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => d.data.title)
          .reverse()
          .join("/")}\n${format(d.value)}`
    );

  // Add gradients for the arcs.
  const gradients = svg
    .append("defs")
    .selectAll("linearGradient")
    .data(root.descendants().filter((d) => d.depth))
    .join("linearGradient")
    .attr("id", (d) => `gradient${d.data.title.replace(/\s/g, "")}`)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", (d) => Math.cos(d.x0))
    .attr("y1", (d) => Math.sin(d.x0))
    .attr("x2", (d) => Math.cos(d.x1))
    .attr("y2", (d) => Math.sin(d.x1));

  gradients
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", (d) => {
      const completionPercentage =
        (d.data.original_estimate - d.value) / d.data.original_estimate;
      return d3.interpolateTurbo(completionPercentage);
    });

  gradients
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", (d) => {
      const completionPercentage =
        (d.data.original_estimate - d.value) / d.data.original_estimate;
      return d3.color(d3.interpolateTurbo(completionPercentage)).darker(0.3);
    });

  // Add a label for each element.
  svg
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .selectAll("text")
    .data(
      root
        .descendants()
        .filter((d) => d.depth && ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 10)
    )
    .join("text")
    .attr("transform", function (d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    })
    .attr("dy", "0.35em")
    .text((d) => d.data.title);

  return svg.node();
}
