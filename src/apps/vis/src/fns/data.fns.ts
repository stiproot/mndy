import { rndInt } from "./rnd.fns";
import { IUnit } from "@/types/i-unit";

export const enrich = (n: IUnit, predicateFn: (n: IUnit) => boolean, enrichFns: ((n: IUnit) => void)[]) => {

  if (predicateFn && predicateFn(n)) {
    enrichFns.forEach((fn) => fn(n));
  }

  if (!predicateFn) {
    enrichFns.forEach((fn) => fn(n));
  }

  (n.children ?? []).forEach((c) => enrich(c, predicateFn, enrichFns));
};

export const deepFilter = (root: IUnit, predicates: ((node: IUnit) => boolean)[], filtered: IUnit[]) => {
  for (const node of root.children || []) {
    let match = true;
    for (const predicate of predicates) {
      match = match && predicate(node);
    }

    if (match) {
      filtered.push(node);
    }
  }

  for (const node of root.children || []) {
    deepFilter(node, predicates, filtered);
  }
};

export const filterByType = (raw: IUnit, type = "Task", doEnrich = false) => {
  // enrich...
  if (doEnrich) {
    const isTaskPredicateFn = (n: IUnit) => n.type === "Task";
    const enrichTaskFn = [(n: IUnit) => (n.risk_weight = rndInt())];
    enrich(raw, isTaskPredicateFn, enrichTaskFn);
  }

  // filter...
  const filtered: IUnit[] = [];
  const typeFilter = (n: IUnit) => n.type === type;
  deepFilter(raw, [typeFilter], filtered);

  return filtered;
};

export const filterForTreesWithTasks = (raw: IUnit, doEnrich = false) => {
  if (doEnrich) {
    const isTaskPredicateFn = (n: IUnit) => n["type"] === "Task";
    const enrichTaskFn = [(n: IUnit) => (n.risk_weight = rndInt())];
    enrich(raw, isTaskPredicateFn, enrichTaskFn);
  }

  const taskFilterFn = (_node: IUnit, tasks: IUnit[]) => {
    if (_node.type === "Task") {
      tasks.push(_node);
    } else {
      _node.children.forEach((c) => taskFilterFn(c, tasks));
    }
  };

  raw.children = raw.children.filter((n) => {
    const tasks: IUnit[] = [];
    taskFilterFn(n, tasks);
    return tasks.length > 0;
  });

  return raw;
};
