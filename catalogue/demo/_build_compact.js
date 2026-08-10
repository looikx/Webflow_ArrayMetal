const fs = require("fs");
const path = require("path");

// Rebuild embed from full demo, minify CSS only (never touch JS)
const src = fs.readFileSync(path.join(__dirname, "catalogue-demo.html"), "utf8");
const styleM = src.match(/<style>([\s\S]*?)<\/style>/);
const bodyM = src.match(/<body>([\s\S]*?)<script>/);
const scriptM = src.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);
if (!styleM || !bodyM || !scriptM) {
  console.error("parse fail");
  process.exit(1);
}

function scopeCss(cssText, scope) {
  let out = "";
  cssText = cssText.replace(/:root\s*\{/g, scope + " {");
  let i = 0;
  const n = cssText.length;
  while (i < n) {
    if (/\s/.test(cssText[i])) {
      out += cssText[i];
      i++;
      continue;
    }
    if (cssText.slice(i, i + 2) === "/*") {
      const j = cssText.indexOf("*/", i + 2);
      out += cssText.slice(i, j + 2);
      i = j + 2;
      continue;
    }
    if (cssText[i] === "@") {
      const j = cssText.indexOf("{", i);
      if (j === -1) {
        out += cssText.slice(i);
        break;
      }
      const header = cssText.slice(i, j);
      let depth = 0;
      let k = j;
      while (k < n) {
        if (cssText[k] === "{") depth++;
        else if (cssText[k] === "}") {
          depth--;
          if (depth === 0) {
            k++;
            break;
          }
        }
        k++;
      }
      const block = cssText.slice(j + 1, k - 1);
      out += header + "{" + scopeCss(block, scope) + "}";
      i = k;
      continue;
    }
    const j = cssText.indexOf("{", i);
    if (j === -1) {
      out += cssText.slice(i);
      break;
    }
    const selectors = cssText.slice(i, j).trim();
    let depth = 0;
    let k = j;
    while (k < n) {
      if (cssText[k] === "{") depth++;
      else if (cssText[k] === "}") {
        depth--;
        if (depth === 0) {
          k++;
          break;
        }
      }
      k++;
    }
    const bodyCss = cssText.slice(j, k);
    const parts = selectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sel) => {
        if (sel.startsWith(scope)) return sel;
        if (sel === "html" || sel === "body") return scope;
        if (sel.startsWith("html ") || sel.startsWith("body "))
          return scope + sel.slice(4);
        return scope + " " + sel;
      });
    out += parts.join(", ") + bodyCss;
    i = k;
  }
  return out;
}

let body = bodyM[1].trim();
body = body.replace(
  "Prototype · Oglaend-style hierarchy (overview → system → articles + filters) · not live Webflow yet",
  "DRAFT · Oglaend-style hierarchy prototype · not live products · do not publish until approved"
);

let scoped = scopeCss(styleM[1].trim(), "#am-cat");
// minify CSS only
scoped = scoped
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s*([{}:;,])\s*/g, "$1")
  .replace(/\n+/g, "")
  .trim();

const script = scriptM[1].trim(); // keep JS intact

const embed = [
  "<!-- Array Metal catalogue demo Phase 1 — draft /demo-product-catalogue only -->",
  "<style>" + scoped + "</style>",
  '<div id="am-cat">',
  body,
  "</div>",
  "<script>",
  script,
  "</script>",
  "",
].join("\n");

const out = path.join(__dirname, "catalogue-embed.html");
fs.writeFileSync(out, embed, "utf8");
console.log("wrote", out, "len", embed.length);
// also write a one-line JSON string for tooling
fs.writeFileSync(
  path.join(__dirname, "chunks", "embed_code.json"),
  JSON.stringify(embed),
  "utf8"
);
console.log("json ready");
