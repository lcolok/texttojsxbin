"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
function GetESDInterface() {
    const platform = `${process.platform}`;
    const platformArch = `${process.arch}`;
    var esdinterface = undefined;
    var ESdebugExtensionPath = path_1.resolve('public/jsxbin/esdebugger-core');
    if (platform === "darwin") {
        esdinterface = require(ESdebugExtensionPath + "/mac/esdcorelibinterface.node");
    }
    else if (platform === "win32") {
        if (platformArch === "x64" || platformArch === "arm64") {
            esdinterface = require(ESdebugExtensionPath + "/win/x64/esdcorelibinterface.node");
        }
        else {
            esdinterface = require(ESdebugExtensionPath + "/win/win32/esdcorelibinterface.node");
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
function exportContentToJSX(scriptSource) {
    var compiledSource = "";
    var apiData = GetESDInterface().esdCompileToJSXBin(scriptSource, "", "");
    if (apiData.status !== 0) {
        console.log("Unable to proceed. Error Code: " + apiData.status);
        fetchLastErrorAndExit();
    }
    else {
        compiledSource = apiData.data;
    }
    return compiledSource;
}
function buildReplacementText(textToEncode, encodedText) {
    let evalString = encodedText.replace('@2.0@', '@2.1@').replace(/\n/g, '');
    return evalString;
}
function t2j(input) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "texttojsxbin" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let textToEncode = input;
    let encodedText = "";
    let textToReplace = "";
    init();
    try {
        encodedText = exportContentToJSX(textToEncode);
        if (encodedText === "") {
            // Display a message box to the user
            destroy();
            process.exit(1);
            return false;
        }
        textToReplace = buildReplacementText(textToEncode, encodedText);
    }
    catch (error) {
        console.log(error);
        destroy();
        process.exit(1);
    }
    destroy();
    return textToReplace;
}
exports.default = t2j;
//# sourceMappingURL=index.js.map