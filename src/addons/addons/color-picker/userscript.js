import codeEditorHandler from "./code-editor.js";
// TW: we built this into the paint editor natively instead
/*
import paintEditorHandler from "./paint-editor.js";
*/

// Load tinycolor here, and execute code after that
// Note that we don't await other scripts (they block!)
export default async (api) => {
  // TW: we made tinycolor into module instead
  /*
  const { addon } = api;
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  */
  codeEditorHandler(api);
  // TW: we built this into the paint editor natively instead
  /*
  paintEditorHandler(api);
  */
};
