/**
 * Build a slimmer Webflow-safe embed (~half size) still covering full hierarchy UX:
 * Products → Cable Ladders → AML filters → article specs
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "catalogue-demo.html"), "utf8");
const styleM = src.match(/<style>([\s\S]*?)<\/style>/);
const bodyM = src.match(/<body>([\s\S]*?)<script>/);
const scriptM = src.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);

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
      const header = cssText.slice(i, j);
      let depth = 0,
        k = j;
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
      out += header + "{" + scopeCss(cssText.slice(j + 1, k - 1), scope) + "}";
      i = k;
      continue;
    }
    const j = cssText.indexOf("{", i);
    if (j === -1) {
      out += cssText.slice(i);
      break;
    }
    const selectors = cssText.slice(i, j).trim();
    let depth = 0,
      k = j;
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

let style = scopeCss(styleM[1].trim(), "#am-cat");
style = style
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s*([{}:;,])\s*/g, "$1")
  .replace(/\n+/g, "")
  .trim();

let body = bodyM[1]
  .trim()
  .replace(
    "Prototype · Oglaend-style hierarchy (overview → system → articles + filters) · not live Webflow yet",
    "DRAFT · Oglaend-style hierarchy · Webflow draft page · not live products"
  );

// Keep full script logic but remove block comments only (safe)
let script = scriptM[1]
  .trim()
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\n[ \t]+/g, "\n")
  .replace(/\n{2,}/g, "\n");

const embed = [
  "<!-- Phase 1 draft: /demo-product-catalogue -->",
  "<style>" + style + "</style>",
  '<div id="am-cat">',
  body,
  "</div>",
  "<script>",
  script,
  "</script>",
  "",
].join("\n");

fs.writeFileSync(path.join(__dirname, "catalogue-embed.html"), embed, "utf8");
// body-only (styles already in page head freeform)
const rest = embed.replace(/<style>[\s\S]*?<\/style>\n?/, "").trim();
fs.writeFileSync(path.join(__dirname, "chunks", "for_htmlembed.txt"), rest);
console.log(JSON.stringify({ full: embed.length, rest: rest.length }));
