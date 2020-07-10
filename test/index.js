const extension = require("../out/extension");

let jsxbin = extension.default(`alert('哈哈哈哈')`);
console.log("jsxbin", jsxbin);
