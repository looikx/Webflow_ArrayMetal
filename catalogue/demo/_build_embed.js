const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "catalogue-demo.html");
const outPath = path.join(__dirname, "catalogue-embed.html");
const src = fs.readFileSync(srcPath, "utf8");

const styleM = src.match(/<style>([\s\S]*?)<\/style>/);
const bodyM = src.match(/<body>([\s\S]*?)<script>/);
const scriptM = src.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);

if (!styleM || !bodyM || !scriptM) {
  console.error("parse fail", {
    style: !!styleM,
    body: !!bodyM,
    script: !!scriptM,
  });
  process.exit(1);
}

let style = styleM[1].trim();
let body = bodyM[1].trim();
const script = scriptM[1].trim();

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

const scoped = scopeCss(style, "#am-cat");
body = body.replace(
  "Prototype · Oglaend-style hierarchy (overview → system → articles + filters) · not live Webflow yet",
  "DRAFT · Oglaend-style hierarchy prototype · not live products · do not publish until approved"
);

const embed = [
  "<!--",
  "  Array Metal — Product Catalogue Demo embed (Phase 1)",
  "  Oglaend-style hierarchy: Products → group → system (filters) → article",
  "  Paste into HtmlEmbed on draft page /demo-product-catalogue",
  "  Do NOT publish until approved. Does not edit live /productscms.",
  "-->",
  "<style>",
  scoped,
  "</style>",
  '<div id="am-cat">',
  body,
  "</div>",
  "<script>",
  script,
  "</script>",
  "",
].join("\n");

fs.writeFileSync(outPath, embed, "utf8");
console.log("wrote", outPath, "chars", embed.length);
