/**
 * Reads catalogue-embed.html and prints metadata.
 * Actual write goes through Webflow MCP set_settings / freeform.
 */
const fs = require("fs");
const path = require("path");
const embed = fs.readFileSync(path.join(__dirname, "catalogue-embed.html"), "utf8");
// body-only for HtmlEmbed when styles already in page head freeform
const style = embed.match(/<style>[\s\S]*?<\/style>/)?.[0] || "";
const rest = embed.replace(style, "").trim();
fs.writeFileSync(path.join(__dirname, "chunks", "for_htmlembed.txt"), rest);
fs.writeFileSync(path.join(__dirname, "chunks", "for_htmlembed_full.txt"), embed);
console.log(
  JSON.stringify({
    full: embed.length,
    rest: rest.length,
    style: style.length,
    hasApp: rest.includes('id="app"'),
    hasGo: /function go\s*\(/.test(rest),
  })
);
