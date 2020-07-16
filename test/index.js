const { single, multi, init, destroy, t2j, t2f } = require("../out");

init();
init()()();

let jsxbin = t2j(`alert('哈哈哈哈')`);
console.log("jsxbin", jsxbin);

let jsxbin2 = t2j(["1", "2", "3", "4"]);
console.log("jsxbin", jsxbin2);

t2f("./hahah", `alert('哈哈哈哈');`);

destroy()();
