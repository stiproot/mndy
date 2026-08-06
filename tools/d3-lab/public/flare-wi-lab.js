export const flareData = {
  "name": "flare",
  "children": [
    {
      "name": "analytics",
      "children": [
        {
          "name": "cluster",
          "children": [
            { "name": "AgglomerativeCluster", "weighting": 3938 },
            { "name": "CommunityStructure", "weighting": 3812 },
            { "name": "HierarchicalCluster", "weighting": 6714 },
            { "name": "MergeEdge", "weighting": 743 }
          ]
        },
        {
          "name": "graph",
          "children": [
            { "name": "BetweennessCentrality", "weighting": 3534 },
            { "name": "LinkDistance", "weighting": 5731 },
            { "name": "MaxFlowMinCut", "weighting": 7840 },
            { "name": "ShortestPaths", "weighting": 5914 },
            { "name": "SpanningTree", "weighting": 3416 }
          ]
        },
        {
          "name": "optimization",
          "children": [
            { "name": "AspectRatioBanker", "weighting": 7074 }
          ]
        }
      ]
    },
    {
      "name": "animate",
      "children": [
        { "name": "Easing", "weighting": 17010 },
        { "name": "FunctionSequence", "weighting": 5842 },
        {
          "name": "interpolate",
          "children": [
            { "name": "ArrayInterpolator", "weighting": 1983 },
            { "name": "ColorInterpolator", "weighting": 2047 },
            { "name": "DateInterpolator", "weighting": 1375 },
            { "name": "Interpolator", "weighting": 8746 },
            { "name": "MatrixInterpolator", "weighting": 2202 },
            { "name": "NumberInterpolator", "weighting": 1382 },
            { "name": "ObjectInterpolator", "weighting": 1629 },
            { "name": "PointInterpolator", "weighting": 1675 },
            { "name": "RectangleInterpolator", "weighting": 2042 }
          ]
        },
        { "name": "ISchedulable", "weighting": 1041 },
        { "name": "Parallel", "weighting": 5176 },
        { "name": "Pause", "weighting": 449 },
        { "name": "Scheduler", "weighting": 5593 },
        { "name": "Sequence", "weighting": 5534 },
        { "name": "Transition", "weighting": 9201 },
        { "name": "Transitioner", "weighting": 19975 },
        { "name": "TransitionEvent", "weighting": 1116 },
        { "name": "Tween", "weighting": 6006 }
      ]
    },
    {
      "name": "data",
      "children": [
        {
          "name": "converters",
          "children": [
            { "name": "Converters", "weighting": 721 },
            { "name": "DelimitedTextConverter", "weighting": 4294 },
            { "name": "GraphMLConverter", "weighting": 9800 },
            { "name": "IDataConverter", "weighting": 1314 },
            { "name": "JSONConverter", "weighting": 2220 }
          ]
        },
        { "name": "DataField", "weighting": 1759 },
        { "name": "DataSchema", "weighting": 2165 },
        { "name": "DataSet", "weighting": 586 },
        { "name": "DataSource", "weighting": 3331 },
        { "name": "DataTable", "weighting": 772 },
        { "name": "DataUtil", "weighting": 3322 }
      ]
    },
    {
      "name": "display",
      "children": [
        { "name": "DirtySprite", "weighting": 8833 },
        { "name": "LineSprite", "weighting": 1732 },
        { "name": "RectSprite", "weighting": 3623 },
        { "name": "TextSprite", "weighting": 10066 }
      ]
    },
    {
      "name": "flex",
      "children": [
        { "name": "FlareVis", "weighting": 4116 }
      ]
    },
    {
      "name": "physics",
      "children": [
        { "name": "DragForce", "weighting": 1082 },
        { "name": "GravityForce", "weighting": 1336 },
        { "name": "IForce", "weighting": 319 },
        { "name": "NBodyForce", "weighting": 10498 },
        { "name": "Particle", "weighting": 2822 },
        { "name": "Simulation", "weighting": 9983 },
        { "name": "Spring", "weighting": 2213 },
        { "name": "SpringForce", "weighting": 1681 }
      ]
    },
    {
      "name": "query",
      "children": [
        { "name": "AggregateExpression", "weighting": 1616 },
        { "name": "And", "weighting": 1027 },
        { "name": "Arithmetic", "weighting": 3891 },
        { "name": "Average", "weighting": 891 },
        { "name": "BinaryExpression", "weighting": 2893 },
        { "name": "Comparison", "weighting": 5103 },
        { "name": "CompositeExpression", "weighting": 3677 },
        { "name": "Count", "weighting": 781 },
        { "name": "DateUtil", "weighting": 4141 },
        { "name": "Distinct", "weighting": 933 },
        { "name": "Expression", "weighting": 5130 },
        { "name": "ExpressionIterator", "weighting": 3617 },
        { "name": "Fn", "weighting": 3240 },
        { "name": "If", "weighting": 2732 },
        { "name": "IsA", "weighting": 2039 },
        { "name": "Literal", "weighting": 1214 },
        { "name": "Match", "weighting": 3748 },
        { "name": "Maximum", "weighting": 843 },
        {
          "name": "methods",
          "children": [
            { "name": "add", "weighting": 593 },
            { "name": "and", "weighting": 330 },
            { "name": "average", "weighting": 287 },
            { "name": "count", "weighting": 277 },
            { "name": "distinct", "weighting": 292 },
            { "name": "div", "weighting": 595 },
            { "name": "eq", "weighting": 594 },
            { "name": "fn", "weighting": 460 },
            { "name": "gt", "weighting": 603 },
            { "name": "gte", "weighting": 625 },
            { "name": "iff", "weighting": 748 },
            { "name": "isa", "weighting": 461 },
            { "name": "lt", "weighting": 597 },
            { "name": "lte", "weighting": 619 },
            { "name": "max", "weighting": 283 },
            { "name": "min", "weighting": 283 },
            { "name": "mod", "weighting": 591 },
            { "name": "mul", "weighting": 603 },
            { "name": "neq", "weighting": 599 },
            { "name": "not", "weighting": 386 },
            { "name": "or", "weighting": 323 },
            { "name": "orderby", "weighting": 307 },
            { "name": "range", "weighting": 772 },
            { "name": "select", "weighting": 296 },
            { "name": "stddev", "weighting": 363 },
            { "name": "sub", "weighting": 600 },
            { "name": "sum", "weighting": 280 },
            { "name": "update", "weighting": 307 },
            { "name": "variance", "weighting": 335 },
            { "name": "where", "weighting": 299 },
            { "name": "xor", "weighting": 354 },
            { "name": "_", "weighting": 264 }
          ]
        },
        { "name": "Minimum", "weighting": 843 },
        { "name": "Not", "weighting": 1554 },
        { "name": "Or", "weighting": 970 },
        { "name": "Query", "weighting": 13896 },
        { "name": "Range", "weighting": 1594 },
        { "name": "StringUtil", "weighting": 4130 },
        { "name": "Sum", "weighting": 791 },
        { "name": "Variable", "weighting": 1124 },
        { "name": "Variance", "weighting": 1876 },
        { "name": "Xor", "weighting": 1101 }
      ]
    },
    {
      "name": "scale",
      "children": [
        { "name": "IScaleMap", "weighting": 2105 },
        { "name": "LinearScale", "weighting": 1316 },
        { "name": "LogScale", "weighting": 3151 },
        { "name": "OrdinalScale", "weighting": 3770 },
        { "name": "QuantileScale", "weighting": 2435 },
        { "name": "QuantitativeScale", "weighting": 4839 },
        { "name": "RootScale", "weighting": 1756 },
        { "name": "Scale", "weighting": 4268 },
        { "name": "ScaleType", "weighting": 1821 },
        { "name": "TimeScale", "weighting": 5833 }
      ]
    },
    {
      "name": "util",
      "children": [
        { "name": "Arrays", "weighting": 8258 },
        { "name": "Colors", "weighting": 10001 },
        { "name": "Dates", "weighting": 8217 },
        { "name": "Displays", "weighting": 12555 },
        { "name": "Filter", "weighting": 2324 },
        { "name": "Geometry", "weighting": 10993 },
        {
          "name": "heap",
          "children": [
            { "name": "FibonacciHeap", "weighting": 9354 },
            { "name": "HeapNode", "weighting": 1233 }
          ]
        },
        { "name": "IEvaluable", "weighting": 335 },
        { "name": "IPredicate", "weighting": 383 },
        { "name": "IweightingProxy", "weighting": 874 },
        {
          "name": "math",
          "children": [
            { "name": "DenseMatrix", "weighting": 3165 },
            { "name": "IMatrix", "weighting": 2815 },
            { "name": "SparseMatrix", "weighting": 3366 }
          ]
        },
        { "name": "Maths", "weighting": 17705 },
        { "name": "Orientation", "weighting": 1486 },
        {
          "name": "palette",
          "children": [
            { "name": "ColorPalette", "weighting": 6367 },
            { "name": "Palette", "weighting": 1229 },
            { "name": "ShapePalette", "weighting": 2059 },
            { "name": "weightingPalette", "weighting": 2291 }
          ]
        },
        { "name": "Property", "weighting": 5559 },
        { "name": "Shapes", "weighting": 19118 },
        { "name": "Sort", "weighting": 6887 },
        { "name": "Stats", "weighting": 6557 },
        { "name": "Strings", "weighting": 22026 }
      ]
    },
    {
      "name": "vis",
      "children": [
        {
          "name": "axis",
          "children": [
            { "name": "Axes", "weighting": 1302 },
            { "name": "Axis", "weighting": 24593 },
            { "name": "AxisGridLine", "weighting": 652 },
            { "name": "AxisLabel", "weighting": 636 },
            { "name": "CartesianAxes", "weighting": 6703 }
          ]
        },
        {
          "name": "controls",
          "children": [
            { "name": "AnchorControl", "weighting": 2138 },
            { "name": "ClickControl", "weighting": 3824 },
            { "name": "Control", "weighting": 1353 },
            { "name": "ControlList", "weighting": 4665 },
            { "name": "DragControl", "weighting": 2649 },
            { "name": "ExpandControl", "weighting": 2832 },
            { "name": "HoverControl", "weighting": 4896 },
            { "name": "IControl", "weighting": 763 },
            { "name": "PanZoomControl", "weighting": 5222 },
            { "name": "SelectionControl", "weighting": 7862 },
            { "name": "TooltipControl", "weighting": 8435 }
          ]
        },
        {
          "name": "data",
          "children": [
            { "name": "Data", "weighting": 20544 },
            { "name": "DataList", "weighting": 19788 },
            { "name": "DataSprite", "weighting": 10349 },
            { "name": "EdgeSprite", "weighting": 3301 },
            { "name": "NodeSprite", "weighting": 19382 },
            {
              "name": "render",
              "children": [
                { "name": "ArrowType", "weighting": 698 },
                { "name": "EdgeRenderer", "weighting": 5569 },
                { "name": "IRenderer", "weighting": 353 },
                { "name": "ShapeRenderer", "weighting": 2247 }
              ]
            },
            { "name": "ScaleBinding", "weighting": 11275 },
            { "name": "Tree", "weighting": 7147 },
            { "name": "TreeBuilder", "weighting": 9930 }
          ]
        },
        {
          "name": "events",
          "children": [
            { "name": "DataEvent", "weighting": 2313 },
            { "name": "SelectionEvent", "weighting": 1880 },
            { "name": "TooltipEvent", "weighting": 1701 },
            { "name": "VisualizationEvent", "weighting": 1117 }
          ]
        },
        {
          "name": "legend",
          "children": [
            { "name": "Legend", "weighting": 20859 },
            { "name": "LegendItem", "weighting": 4614 },
            { "name": "LegendRange", "weighting": 10530 }
          ]
        },
        {
          "name": "operator",
          "children": [
            {
              "name": "distortion",
              "children": [
                { "name": "BifocalDistortion", "weighting": 4461 },
                { "name": "Distortion", "weighting": 6314 },
                { "name": "FisheyeDistortion", "weighting": 3444 }
              ]
            },
            {
              "name": "encoder",
              "children": [
                { "name": "ColorEncoder", "weighting": 3179 },
                { "name": "Encoder", "weighting": 4060 },
                { "name": "PropertyEncoder", "weighting": 4138 },
                { "name": "ShapeEncoder", "weighting": 1690 },
                { "name": "weightingEncoder", "weighting": 1830 }
              ]
            },
            {
              "name": "filter",
              "children": [
                { "name": "FisheyeTreeFilter", "weighting": 5219 },
                { "name": "GraphDistanceFilter", "weighting": 3165 },
                { "name": "VisibilityFilter", "weighting": 3509 }
              ]
            },
            { "name": "IOperator", "weighting": 1286 },
            {
              "name": "label",
              "children": [
                { "name": "Labeler", "weighting": 9956 },
                { "name": "RadialLabeler", "weighting": 3899 },
                { "name": "StackedAreaLabeler", "weighting": 3202 }
              ]
            },
            {
              "name": "layout",
              "children": [
                { "name": "AxisLayout", "weighting": 6725 },
                { "name": "BundledEdgeRouter", "weighting": 3727 },
                { "name": "CircleLayout", "weighting": 9317 },
                { "name": "CirclePackingLayout", "weighting": 12003 },
                { "name": "DendrogramLayout", "weighting": 4853 },
                { "name": "ForceDirectedLayout", "weighting": 8411 },
                { "name": "IcicleTreeLayout", "weighting": 4864 },
                { "name": "IndentedTreeLayout", "weighting": 3174 },
                { "name": "Layout", "weighting": 7881 },
                { "name": "NodeLinkTreeLayout", "weighting": 12870 },
                { "name": "PieLayout", "weighting": 2728 },
                { "name": "RadialTreeLayout", "weighting": 12348 },
                { "name": "RandomLayout", "weighting": 870 },
                { "name": "StackedAreaLayout", "weighting": 9121 },
                { "name": "TreeMapLayout", "weighting": 9191 }
              ]
            },
            { "name": "Operator", "weighting": 2490 },
            { "name": "OperatorList", "weighting": 5248 },
            { "name": "OperatorSequence", "weighting": 4190 },
            { "name": "OperatorSwitch", "weighting": 2581 },
            { "name": "SortOperator", "weighting": 2023 }
          ]
        },
        { "name": "Visualization", "weighting": 16540 }
      ]
    }
  ]
}
