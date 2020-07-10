const extension = require("../out");

let jsxbin = extension.single(`alert('哈哈哈哈')`);
console.log("jsxbin", jsxbin);

let jsxbin2 = extension.multi(["1", "2", "3", "4"]);
console.log("jsxbin", jsxbin2);
