const fs = require("fs");
const path = require("path");
const code = fs.readFileSync(path.join(__dirname, "chunks", "for_mcp.txt"), "utf8");
const styleMatch = code.match(/<style>[\s\S]*?<\/style>/);
const rest = code.replace(styleMatch[0], "").trim();
console.log("style len", styleMatch[0].length);
console.log("rest len", rest.length);
fs.writeFileSync(path.join(__dirname, "chunks", "part_style.txt"), styleMatch[0]);
fs.writeFileSync(path.join(__dirname, "chunks", "part_body.txt"), rest);
