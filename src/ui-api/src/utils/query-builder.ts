export interface ProjsQryData {
  userId?: string;
  isPinned?: string;
}

export interface DaprQueryFilter {
  filter?: {
    AND?: Array<{ EQ: Record<string, string> }>;
    EQ?: Record<string, string>;
  };
}

export const buildProjsQry = (qryData: ProjsQryData | undefined): DaprQueryFilter => {
  if (!qryData) return {};

  const { userId, isPinned } = qryData;

  if (userId && isPinned === "true") {
    return {
      filter: {
        AND: [{ EQ: { user_id: userId } }, { EQ: { is_pinned: isPinned } }],
      },
    };
  }

  if (userId) {
    return {
      filter: {
        EQ: { user_id: userId },
      },
    };
  }

  return {};
};
