type Diff = Record<string, { oldValue: any; newValue: any }>;

export function deepDiff(obj1: any, obj2: any): Diff {
  const diff: Diff = {};

  function compareObjects(a: any, b: any, path: string[]) {
    for (const key in a) {
      const newPath = path.concat(key);
      const aValue = a[key];
      const bValue = b ? b[key] : undefined;

      if (bValue === undefined) {
        diff[newPath.join(".")] = { oldValue: aValue, newValue: undefined };
      } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
        compareArrays(aValue, bValue, newPath);
      } else if (typeof aValue === "object" && typeof bValue === "object" && aValue !== null && bValue !== null) {
        compareObjects(aValue, bValue, newPath);
      } else if (aValue !== bValue) {
        diff[newPath.join(".")] = { oldValue: aValue, newValue: bValue };
      }
    }

    for (const key in b) {
      if (a[key] === undefined) {
        const newPath = path.concat(key);
        diff[newPath.join(".")] = { oldValue: undefined, newValue: b[key] };
      }
    }
  }

  function compareArrays(a: any[], b: any[], path: string[]) {
    const maxLength = Math.max(a.length, b.length);

    for (let i = 0; i < maxLength; i++) {
      const newPath = path.concat(i.toString());

      if (i >= a.length) {
        diff[newPath.join(".")] = { oldValue: undefined, newValue: b[i] };
      } else if (i >= b.length) {
        diff[newPath.join(".")] = { oldValue: a[i], newValue: undefined };
      } else if (typeof a[i] === "object" && typeof b[i] === "object" && a[i] !== null && b[i] !== null) {
        compareObjects(a[i], b[i], newPath);
      } else if (a[i] !== b[i]) {
        diff[newPath.join(".")] = { oldValue: a[i], newValue: b[i] };
      }
    }
  }

  compareObjects(obj1, obj2, []);

  return diff;
}

export function isDiff(obj1: any, obj2: any): boolean {
  if (!obj1 || !obj2) {
    return false;
  }

  if (Object.keys(obj1).length === 0 || Object.keys(obj2).length === 0) {
    return false;
  }

  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return true;
  }

  return Object.keys(deepDiff(obj1, obj2)).length > 0;
}
