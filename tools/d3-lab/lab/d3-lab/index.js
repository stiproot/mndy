import * as d3 from 'd3';
import { nodes } from './data.js';

const data = { "type": "Epic", "children": nodes, "id": 0 }

const color = d3.scaleOrdinal(data.children.map(d => d.type), d3.schemeTableau10);
// console.log('color', color);

const hierarchy = d3.hierarchy(data)
  .sum(d => d.children.length)
  .sort((a, b) => b.id - a.id);

// console.log('hierarchy', hierarchy);

const width = 100;
const height = 100;

const rootFn = d3.treemap()
  .tile(d3.treemapSquarify) // e.g., d3.treemapSquarify
  .size([width, height])
  .padding(1)
  .round(true);

const root = rootFn(hierarchy);

// console.log('root', root);

