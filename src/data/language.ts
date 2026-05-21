export const getSelectedOrDefaultWhere = (langId: string | null) => {
  return {
    OR: langId
      ? [{ languageId: { equals: langId } }]
      : [{ languageId: null }, { language: { isDefault: true } }],
  };
};
