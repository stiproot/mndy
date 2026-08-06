
export const buildWiqlFromTag = (tag: string): string => {
  const predicate = buildTagsPredicate([tag]);
  const wiql = buildWiql(predicate);
  return wiql;
};

export const buildTagsPredicate = (tags: string[]): string => {
  if (!tags || !tags.length) throw new Error("No tags provided");
  const pred = tags
    .map((t) => `[System.Tags] CONTAINS '${t}'`)
    .join(" AND ");
  return pred;
};

export const buildIdsPredicate = (ids: string[]) => {
  if (!ids || !ids.length) return null;
  const pred = `(${ids.map((t) => `[System.Id] = ${t}`).join(" OR ")})`;
  return pred;
};

export const buildQryName = (tags: string[]) => tags.join("_");

export const extractTagsFromQl = (ql: string) => {
  if (!ql) return [];

  const tagsRe = /\[System\.Tags\]\s+CONTAINS\s+'([^']+)'/g;
  const tagValueRe = /(?<=\[System\.Tags\] CONTAINS ').+(?=')/g;

  const systemTagsContains = ql.match(tagsRe);
  if (!systemTagsContains) return [];
  const tagsArr = systemTagsContains
    .map((m) => m.match(tagValueRe))
    .map((m) => m ? m[0] : null)
    .filter(m => m);

  return tagsArr;
};

export const extractIdsFromQl = (ql: string) => {
  if (!ql) return [];

  const idsRe = /\[System\.Id\]\s+[=]\s\d+/g;
  const idValRe = /\d+/;

  const systemIdEquals = ql.match(idsRe);
  if (!systemIdEquals) return [];

  const idsArr = systemIdEquals
    .map((m) => m.match(idValRe))
    .map((m) => m ? m[0] : null)
    .filter((m) => m);

  return idsArr;
};

export const buildWiql = (tagsPred: string, idsPred: string | null = null) => {
  let wiql =
    `SELECT ` +
    `[System.Id], ` +
    `[System.WorkItemType], ` +
    `[System.Title], ` +
    `[System.AssignedTo], ` +
    `[System.State], ` +
    `[System.Tags]  ` +
    `FROM WorkItems WHERE `;

  if (idsPred && !tagsPred) wiql += `${idsPred}`;
  if (tagsPred && !idsPred) wiql += `${tagsPred}`;
  if (idsPred && tagsPred) wiql += `${tagsPred} AND ${idsPred}`;

  return wiql;
};