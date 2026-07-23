import paintEditorHandler from "./paint-editor.js";

export default async (api) => {
  // TW: tinycolor is module now, don't need to import here
  /*
  const { addon } = api;
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  */
  paintEditorHandler(api);
};
