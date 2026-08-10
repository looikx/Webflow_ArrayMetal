/**
 * Helper: prints character count of catalogue-embed.html for MCP transfer.
 * The agent sets HtmlEmbed code via Webflow MCP set_settings.
 */
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "catalogue-embed.html");
const code = fs.readFileSync(file, "utf8");
// Quick sanity: go() must keep the slash regex
if (!/path\.replace\(\/\^\\\//.test(code) && !/path\.replace\(\/\^\//.test(code)) {
  // tolerate either escaping form
  if (!code.includes("function go(path)") || !code.includes("location.hash")) {
    console.error("embed looks broken");
    process.exit(1);
  }
}
if (code.includes("path.replace(/^\\\n") || code.includes("path.replace(/^\\")) {
  // broken minify pattern
}
console.log(JSON.stringify({ ok: true, len: code.length, hasApp: code.includes('id="app"'), hasAmCat: code.includes('id="am-cat"') }));
