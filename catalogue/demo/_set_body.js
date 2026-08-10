/**
 * Outputs footer freeform content length; body is set via MCP by the agent.
 * For local verification of the demo, open catalogue-demo.html.
 */
const fs = require("fs");
const path = require("path");
const body = fs.readFileSync(path.join(__dirname, "chunks", "part_body.txt"), "utf8");
// Ensure valid for MCP JSON
const payload = {
  page_id: "6a71fa9149bd0b583281bdf3",
  location: "footer",
  content: body,
};
fs.writeFileSync(
  path.join(__dirname, "chunks", "footer_only.json"),
  JSON.stringify(payload)
);
console.log(JSON.stringify({ len: body.length, starts: body.slice(0, 40), ends: body.slice(-30) }));
