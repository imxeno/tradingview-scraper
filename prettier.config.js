// @ts-check

/** @type import("prettier").Options */
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  arrowParens: "avoid",
  trailingComma: "none",
  endOfLine: "lf",
  importOrder: ["__", "<THIRD_PARTY_MODULES>", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
