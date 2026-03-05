import { Selection } from "d3-selection";
import { ExtendedHierarchyPointNode, ITreeConfig } from "../typings";

export const drawNodeUpdate = (
  nodeEnter: Selection<
    SVGGElement,
    ExtendedHierarchyPointNode,
    SVGGElement,
    {}
  >,
  node: Selection<SVGGElement, ExtendedHierarchyPointNode, SVGGElement, {}>,
  settings: ITreeConfig<any>
) => {
  const nodeUpdate = nodeEnter.merge(node);
  nodeUpdate
    //@ts-ignore
    .transition()
    .duration(settings.duration)
    //@ts-ignore
    .attr("transform", (d) => {
      return settings.isHorizontal
        ? "translate(" + d.y + "," + d.x + ")"
        : "translate(" + d.x + "," + d.y + ")";
    });

  nodeUpdate
    .select("foreignObject")
    .attr("width", settings.nodeWidth)
    .attr("height", settings.nodeHeight)
    .style("overflow", "visible")
    .on("click", (_, d) => settings.onNodeClick({ ...d, settings, _ } as any))
    .on("mouseenter", (_, d) => settings.onNodeMouseEnter({ ...d, settings } as any))
    .on("mouseleave", (_, d) => settings.onNodeMouseLeave({ ...d, settings } as any))
    .html((d) => settings.renderNode({ ...d, settings } as any));
};
