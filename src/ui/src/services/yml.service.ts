const yaml = require('js-yaml');

export const enrichJson = (root: any, enrichers: CallableFunction[] = []) => {
  if (Array.isArray(root)) {
    for (const v of root) {
      enrichJson(v, enrichers);
    }
  }
  else if (typeof root === 'object') {
    for (const enricher of enrichers) {
      enricher(root);
    }

    if (root.children && root.children.length) {
      for (const v of root.children) {
        enrichJson(v, enrichers);
      }
    }
  }
};

export const yml2Json = (txt: string, enrichers: CallableFunction[] = []): Object => {
  const jsn = yaml.load(txt);

  enrichJson(jsn, enrichers);

  return jsn;
};

export const json2Yml = (obj: any, enrichers: CallableFunction[] = []): string => {
  enrichJson(obj, enrichers);

  const yml = yaml.dump(obj);

  return yml;
};
