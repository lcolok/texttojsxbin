import { resolve } from "path";
import * as _ from "lodash";
import * as fs from "fs";

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

function init(): Function {
  var initData = GetESDInterface().esdInit();

  if (initData.status !== 0) {
    switch (initData.status) {
      case 11:
        console.log("The esdcorelibinterface has been initialized.");
        break;
      default:
        console.log("Unable to proceed. Error Code: " + initData.status);
        fetchLastErrorAndExit();
        break;
    }
  }
  return init;
}
function destroy(): Function {
  GetESDInterface().esdDestroy();
  return destroy;
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

interface Config {
  needEval: Boolean;
  initNDestroy: Boolean;
}
function single(inputText: String, config: Config) {
  const { needEval, initNDestroy } = config || {
    needEval: true,
    initNDestroy: false
  };

  if (initNDestroy) {
    init();
  }

  let textToReplace = encode(inputText);

  if (textToReplace && needEval) {
    textToReplace = addEval(textToReplace);
  }

  if (initNDestroy) {
    destroy();
  }

  return textToReplace;
}

function multi(inputArray: Array<String>, config: Config) {
  const { needEval, initNDestroy } = config || {
    needEval: true,
    initNDestroy: false
  };

  if (initNDestroy) {
    init();
  }

  let jsxbinArr = inputArray.map(encode);

  if (jsxbinArr && needEval) {
    jsxbinArr = jsxbinArr.map(e => `eval("${e}");`);
  }

  if (initNDestroy) {
    destroy();
  }

  return jsxbinArr;
}

function stratification(sc: string) {
  return _.words(sc, /[@\.\w]{0,80}/g).join("\n");
}

function t2f(
  filePath: string,
  input: Array<string> | string,
  config: Config,
  callback?: (err: NodeJS.ErrnoException | null) => void
): void {
  if (input instanceof Array) {
    input = input.join("\n");
  }
  let newConfig = _.assign(config, { needEval: false });
  let output = t2j(input, newConfig);
  output = stratification(output);
  if (callback === undefined) {
    fs.writeFileSync(filePath, output);
  } else {
    fs.writeFile(filePath, output, callback);
  }
}

function t2j(input: Array<string> | string, config: Config): any {
  let result;
  const { needEval, initNDestroy } = config || {
    needEval: true,
    initNDestroy: false
  };

  if (initNDestroy) {
    init();
  }

  if (input instanceof Array) {
    let jsxbinArr = input.map(encode);
    if (jsxbinArr && needEval) {
      result = jsxbinArr.map(e => `eval("${e}");`);
    } else {
      result = jsxbinArr;
    }
  } else if (typeof input === "string") {
    let textToReplace = encode(input);
    if (textToReplace && needEval) {
      result = addEval(textToReplace);
    } else {
      result = textToReplace;
    }
  }

  if (initNDestroy) {
    destroy();
  }

  return result;
}

export { single, multi, t2j, t2f, init, destroy };
