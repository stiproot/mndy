
export const buildProjsQry = (qryData: any) => {

  const { userId, isPinned } = qryData;

  if (userId && isPinned === "true") {
    const filter = {
      "filter": {
        "AND": [
          { "EQ": { "user_id": userId } },
          { "EQ": { "is_pinned": isPinned } },
        ],
      },
    }

    return filter;
  }

  if (userId) {
    const filter = {
      "filter": {
        "EQ": { "user_id": userId }
      },
    }

    return filter;
  }

  return {};
};