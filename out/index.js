"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.init = exports.t2f = exports.t2j = exports.multi = exports.single = void 0;
const path_1 = require("path");
const _ = require("lodash");
const fs = require("fs");
function GetESDInterface() {
    const platform = `${process.platform}`;
    const platformArch = `${process.arch}`;
    var esdinterface = undefined;
    var ESdebugExtensionPath = path_1.resolve("public/jsxbin/esdebugger-core");
    if (platform === "darwin") {
        esdinterface = require(ESdebugExtensionPath +
            "/mac/esdcorelibinterface.node");
    }
    else if (platform === "win32") {
        if (platformArch === "x64" || platformArch === "arm64") {
            esdinterface = require(ESdebugExtensionPath +
                "/win/x64/esdcorelibinterface.node");
        }
        else {
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
exports.init = init;
function destroy() {
    GetESDInterface().esdDestroy();
    return destroy;
}
exports.destroy = destroy;
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
    let evalString = encodedText.replace("@2.0@", "@2.1@").replace(/\n/g, "");
    return evalString;
}
function encode(input) {
    let textToEncode = input;
    let encodedText = "";
    let textToReplace = "";
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
    return textToReplace;
}
function addEval(input) {
    return `eval("${input}");`;
}
function single(inputText, config) {
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
exports.single = single;
function multi(inputArray, config) {
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
exports.multi = multi;
function stratification(sc) {
    return _.words(sc, /[@\.\w]{0,80}/g).join("\n");
}
function t2f(filePath, input, config, callback) {
    if (input instanceof Array) {
        input = input.join("");
    }
    let newConfig = _.assign(config, { needEval: false });
    let output = t2j(input, newConfig);
    output = stratification(output);
    if (callback === undefined) {
        fs.writeFileSync(filePath, output);
    }
    else {
        fs.writeFile(filePath, output, callback);
    }
}
exports.t2f = t2f;
function t2j(input, config) {
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
        }
        else {
            result = jsxbinArr;
        }
    }
    else if (typeof input === "string") {
        let textToReplace = encode(input);
        if (textToReplace && needEval) {
            result = addEval(textToReplace);
        }
        else {
            result = textToReplace;
        }
    }
    if (initNDestroy) {
        destroy();
    }
    return result;
}
exports.t2j = t2j;
//# sourceMappingURL=index.js.map