const fs = require("fs");
const path = require("path");

let c = fs.readFileSync(path.join(__dirname, "catalogue-embed.html"), "utf8");
c = c.replace(/<!--[\s\S]*?-->/g, "");
c = c.replace(/\n{3,}/g, "\n\n");

c = c.replace(/<style>([\s\S]*?)<\/style>/, (_, css) => {
  const m = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/\n+/g, "")
    .trim();
  return "<style>" + m + "</style>";
});

c = c.replace(/<script>([\s\S]*?)<\/script>/, (_, js) => {
  const m = js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
    .replace(/\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return "<script>\n" + m + "\n</script>";
});

const out = path.join(__dirname, "catalogue-embed.min.html");
fs.writeFileSync(out, c, "utf8");
console.log("min len", c.length);
console.log("out", out);
