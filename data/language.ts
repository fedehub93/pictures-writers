export const getSelectedOrDefaultWhere = (langId: string | null) => {
  return {
    OR: langId
      ? [{ languageId: { equals: langId } }]
      : [
          { languageId: null }, // Contest senza lingua
          { language: { isDefault: true } }, // Contest nella lingua di default
        ],
  };
};
