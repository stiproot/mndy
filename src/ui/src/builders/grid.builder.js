import * as d3 from "d3";

const LOW_RISK_THRESHOLD = 30;
const MEDIUM_RISK_THRESHOLD = 45;
const SQUARE_WIDTH = 220;
const SQUARE_HEIGHT = 90;
const PADDING = 2;
const STROKE_WIDTH = 3;
const MAX_TITLE_LENGTH = 30;
const FONT_SIZE_SMALL = "0.8em";
const FONT_SIZE_NORMAL = "1em";
const TOOLTIP_FONT_SIZE = "12px";
const TOOLTIP_PADDING = "5px";

const colorScale = d3
  .scaleOrdinal()
  .domain(["low", "medium", "high"])
  .range(["#66BB6A", "#FFCA28", "#EF5350"]);

function getColor(riskImpact) {
  if (riskImpact >= 0 && riskImpact <= LOW_RISK_THRESHOLD) {
    return colorScale("low");
  } else if (
    riskImpact > LOW_RISK_THRESHOLD &&
    riskImpact <= MEDIUM_RISK_THRESHOLD
  ) {
    return colorScale("medium");
  } else {
    return colorScale("high");
  }
}

function getDaysOpen(createdAt) {
  const createdDate = new Date(createdAt);
  const currentDate = new Date();
  const differenceInTime = currentDate.getTime() - createdDate.getTime();
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
}

function createSvg(sortedData, columns) {
  const rows = Math.ceil(sortedData.length / columns);
  const svgWidth = columns * (SQUARE_WIDTH + PADDING);
  const svgHeight = rows * (SQUARE_HEIGHT + PADDING);

  return d3
    .create("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", [0, 0, svgWidth, svgHeight])
    .attr(
      "style",
      "max-width: 100%; height: auto; overflow: hidden; font: 17px sans-serif;"
    );
}

function createNodes(svg, sortedData, columns) {
  return svg
    .selectAll(".node")
    .data(sortedData)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr(
      "transform",
      (d, i) =>
        `translate(${(i % columns) * (SQUARE_WIDTH + PADDING)}, ${
          Math.floor(i / columns) * (SQUARE_HEIGHT + PADDING)
        })`
    )
    .on("click", (d) => {
      if (
        d.target &&
        d.target.__data__ &&
        d.target.__data__ &&
        d.target.__data__.ext_url
      ) {
        window.open(d.target.__data__.ext_url, "_blank");
      }
    })
    .style("cursor", "pointer");
}

function appendRectanglesToNodes(nodes, nodeUidId) {
  nodes
    .append("rect")
    .attr("id", (d) => (d.nodeUid = nodeUidId).id)
    .attr("width", SQUARE_WIDTH)
    .attr("height", SQUARE_HEIGHT)
    .attr("fill", (d) => getColor(d.risk_impact))
    .attr("stroke", "#333333")
    .attr("stroke-width", STROKE_WIDTH);
}

function appendRectToNodeGroups(nodeGroups) {
  nodeGroups
    .append("rect")
    .attr("x", (d) => SQUARE_WIDTH - 13 - d.type.length * 8)
    .attr("y", "0em")
    .attr("width", (d) => d.type.length * 8 + 13)
    .attr("height", "2em")
    .attr("fill", "#333333");
}

function appendUseToNodes(nodes, clipUidId) {
  nodes
    .attr("id", (d) => (d.clipUid = clipUidId).id)
    .append("use")
    .attr("xlink:href", (d) => d.nodeUid.href);
}

function appendTextToNodeGroups(nodeGroups) {
  nodeGroups
    .append("text")
    .attr("clip-path", (d) => d.clipUid)
    .selectAll("tspan")
    .data((d) => {
      const title = d.title.length > MAX_TITLE_LENGTH
        ? `${d.title.substring(0, MAX_TITLE_LENGTH)}...`
        : d.title;
      const titleParts = splitTitleIntoTwoParts(title);
      return [
        `${d.risk_impact}/50`,
        d.type,
        titleParts[0],
        titleParts[1],
        `${getDaysOpen(d.utc_created_at)} days`,
      ];
    })
    .join("tspan")
    .attr("x", (d, i) => (i === 1 || i === 4 ? SQUARE_WIDTH - 7 : 9))
    .attr(
      "y",
      (d, i, nodes) =>
        `${
          i < 2 ? 1.5 : (i === nodes.length - 1) * 0.3 + 1.8 + (i - 1) * 1.2 + (i === 4 ? -1.1 : 0)
        }em`
    )
    .attr("fill", function (d, i) {
      const nodeData = d3.select(this.parentNode).datum();
      return i === 1
        ? "white"
        : getColor(nodeData.risk_impact) === "#EF5350"
        ? "white"
        : "#333333";
    })
    .attr("text-anchor", (d, i) => (i === 1 || i === 4 ? "end" : "start"))
    .attr("font-weight", (d, i) => (i === 1 ? "bold" : "normal"))
    .attr("font-size", (d, i) => (i === 1 ? FONT_SIZE_SMALL : FONT_SIZE_NORMAL))
    .attr("font-style", (d, i) => (i === 4 ? "italic" : "normal"))
    .text((d) => d);
}

function splitTitleIntoTwoParts(title, maxLength = 13) {
  if (title.length <= maxLength) {
    return [title, ''];
  } else {
    let spaceIndex = title.lastIndexOf(' ', maxLength);
    if (spaceIndex === -1) {
      spaceIndex = maxLength;
    }
    let part1 = title.substring(0, spaceIndex);
    let part2 = title.substring(spaceIndex + 1);
    if (part1.length > maxLength) {
      part1 = part1.substring(0, maxLength - 1) + '-';
    }
    if (part2.length > maxLength) {
      part2 = part2.substring(0, maxLength - 1) + '...';
    }
    return [part1, part2];
  }
}

function handleMouseOver(nodes, tooltip) {
  nodes
    .on("mouseover", function (event, d) {
      tooltip
        .style("left", `${event.clientX + 40}px`)
        .style("top", `${event.clientY + 20}px`)
        .style("display", "inline-block")
        .style("font-size", TOOLTIP_FONT_SIZE)
        .style("padding", TOOLTIP_PADDING)
        .html(d.title);
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    });
}

export function buildGridSvg(data, columns = 10) {
  const tooltip = d3.select("#tooltip");
  const sortedData = data.sort((a, b) => b.risk_impact - a.risk_impact);
  const svg = createSvg(sortedData, columns);
  const nodeUidId = `nodeUid-${Math.random().toString(36).substr(2, 9)}`;
  const clipUidId = `clipUid-${Math.random().toString(36).substr(2, 9)}`;
  const nodes = createNodes(svg, sortedData, columns);

  appendRectanglesToNodes(nodes, nodeUidId);
  appendUseToNodes(nodes, clipUidId);

  const nodeGroups = nodes.append("g");
  appendRectToNodeGroups(nodeGroups);
  appendTextToNodeGroups(nodeGroups);

  handleMouseOver(nodes, tooltip);

  return svg.node();
}
