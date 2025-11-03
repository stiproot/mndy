
import { IUnit } from "@/types/i-unit";

export const getTasks = (node: IUnit, tasks: IUnit[]) => {
  if (node.children && node.children.length) {
    node.children.forEach((child) => {
      getTasks(child, tasks);
    });
  }

  if (node.type === "Task") {
    tasks.push(node);
  }
};

export const filterTree = (tree: IUnit, predicates: ((node: IUnit) => boolean)[]) => {
  return coreFilterTree(tree, predicates);
};

export const coreFilterTree = (tree: IUnit, predicates: ((node: IUnit) => boolean)[]) => {
  const filteredChildren = filterChildren(tree.children, predicates);
  const filteredTree = {
    ...tree,
    children: filteredChildren,
  };
  return filteredTree;
};

export const filterChildren = (data: IUnit[], predicates: ((node: IUnit) => boolean)[]) => {
  if (!data) {
    return [];
  }

  const filteredData = filterNode(data, predicates);

  const enriched: IUnit[] = filteredData.map((node: IUnit) => {
    const enrichedNode = {
      ...node,
      children: node.children ? filterChildren(node.children, predicates) : [],
    };

    return enrichedNode;
  });

  return enriched;
};

export const filterNode = (data: IUnit[], predicates: ((node: IUnit) => boolean)[]) => {
  const filtered = data.filter((node) => {
    if (node.type === "Task") {
      if (predicates && predicates.length) {
        let accum = true;

        for (const i in predicates) {
          if (predicates[i]) accum = accum && predicates[i](node);
        }

        return accum;
      }

      return true;
    }

    return true;
  });

  return filtered;
};

export const orAccumFilter = (data: IUnit[], predicates: ((node: IUnit) => boolean)[]) => {
  const filtered = data.filter((node) => {
    if (node.type === "Task") {
      let accum = false;
      for (const i in predicates) {
        accum = accum || predicates[i](node);
      }
      return accum;
    }
    return true;
  });

  return filtered;
};

export const andAccumFilter = (data: IUnit[], predicates: ((node: IUnit) => boolean)[]) => {
  const filtered = data.filter((node) => {
    if (node.type === "Task") {
      let accum = true;
      for (const i in predicates) {
        accum = accum && predicates[i](node);
      }
      return accum;
    }
    return true;
  });

  return filtered;
};
