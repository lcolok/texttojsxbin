import { resolve } from "path";

function GetESDInterface() {
  const platform = `${process.platform}`;
  const platformArch = `${process.arch}`;
  var esdinterface = undefined;
  var ESdebugExtensionPath = resolve("public/jsxbin/esdebugger-core");

  if (platform === "darwin") {
    esdinterface = require(ESdebugExtensionPath +
      "/mac/esdcorelibinterface.node");
  } else if (platform === "win32") {
    if (platformArch === "x64" || platformArch === "arm64") {
      esdinterface = require(ESdebugExtensionPath +
        "/win/x64/esdcorelibinterface.node");
    } else {
      esdinterface = require(ESdebugExtensionPath +
        "/win/win32/esdcorelibinterface.node");
    }
    if (esdinterface === undefined) {
      console.log("Platform not supported: " + platform);
      process.exit(1);
    }
  }

  return esdinterface;
}

function fetchLastErrorAndExit() {
  var errorInfo = undefined;
  var error = GetESDInterface().esdGetLastError();
  if (error.status !== 0) {
    if (error.data) {
      errorInfo = error.data;
    }
  }
  if (errorInfo !== undefined) {
    console.log("Unable to proceed. Error Info: " + errorInfo);
  }
  process.exit(1);
}

function init() {
  var initData = GetESDInterface().esdInit();

  if (initData.status !== 0) {
    console.log("Unable to proceed. Error Code: " + initData.status);
    fetchLastErrorAndExit();
  }
}
function destroy() {
  GetESDInterface().esdDestroy();
}

function exportContentToJSX(scriptSource: any) {
  var compiledSource = "";

  var apiData = GetESDInterface().esdCompileToJSXBin(scriptSource, "", "");
  if (apiData.status !== 0) {
    console.log("Unable to proceed. Error Code: " + apiData.status);
    fetchLastErrorAndExit();
  } else {
    compiledSource = apiData.data;
  }

  return compiledSource;
}

function buildReplacementText(textToEncode: String, encodedText: String) {
  let evalString = encodedText.replace("@2.0@", "@2.1@").replace(/\n/g, "");

  return evalString;
}

function encode(input: String) {
  let textToEncode = input;
  let encodedText = "";
  let textToReplace: String = "";
  try {
    encodedText = exportContentToJSX(textToEncode);

    if (encodedText === "") {
      // Display a message box to the user
      destroy();
      process.exit(1);
      return false;
    }

    textToReplace = buildReplacementText(textToEncode, encodedText);
  } catch (error) {
    console.log(error);
    destroy();
    process.exit(1);
  }
  return textToReplace;
}

function addEval(input: String) {
  return `eval("${input}");`;
}

function single(inputText: String, needEval: Boolean = true) {
  init();

  let textToReplace = encode(inputText);

  if (textToReplace && needEval) {
    textToReplace = addEval(textToReplace);
  }

  destroy();

  return textToReplace;
}

function multi(inputArray: Array<String>, needEval: Boolean = true) {
  init();

  let jsxbinArr = inputArray.map(encode);

  if (jsxbinArr && needEval) {
    jsxbinArr = jsxbinArr.map(e => `eval("${e}");`);
  }

  destroy();

  return jsxbinArr;
}

export { single, multi };
