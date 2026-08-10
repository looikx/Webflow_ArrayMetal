const fs = require("fs");
const path = require("path");
const embed = fs.readFileSync(path.join(__dirname, "catalogue-embed.html"), "utf8");
const b64 = Buffer.from(embed, "utf8").toString("base64");
const n = 4;
const size = Math.ceil(b64.length / n);
const parts = [];
for (let i = 0; i < n; i++) {
  parts.push(b64.slice(i * size, (i + 1) * size));
}

const steps = parts.map((p, i) => {
  const content =
    "<script>window.__AM_CAT_B64=window.__AM_CAT_B64||[];window.__AM_CAT_B64[" +
    i +
    "]=" +
    JSON.stringify(p) +
    ";</script>\n";
  fs.writeFileSync(path.join(__dirname, "chunks", "b64_step" + i + ".txt"), content);
  return content.length;
});

const runner = `<script>
(function(){
  var p = window.__AM_CAT_B64 || [];
  if (p.length < ${n}) { console.error("AM cat incomplete", p.length); return; }
  var html = atob(p.join(""));
  var root = document.getElementById("am-cat-mount");
  if (!root) {
    root = document.createElement("div");
    root.id = "am-cat-mount";
    document.body.insertBefore(root, document.body.firstChild);
  }
  var tmp = document.createElement("div");
  tmp.innerHTML = html;
  var scripts = [];
  Array.from(tmp.childNodes).forEach(function(node){
    if (node.nodeType === 1 && node.tagName === "SCRIPT") scripts.push(node.textContent);
    else root.appendChild(node);
  });
  scripts.forEach(function(code){
    var s = document.createElement("script");
    s.textContent = code;
    document.body.appendChild(s);
  });
})();
</script>
`;
fs.writeFileSync(path.join(__dirname, "chunks", "b64_runner.txt"), runner);

// prebuild cumulative freeforms so each set is one call under ~12k if possible
let acc = "";
parts.forEach((p, i) => {
  acc +=
    "<script>window.__AM_CAT_B64=window.__AM_CAT_B64||[];window.__AM_CAT_B64[" +
    i +
    "]=" +
    JSON.stringify(p) +
    ";</script>\n";
  fs.writeFileSync(path.join(__dirname, "chunks", "b64_cumul" + i + ".txt"), acc);
  console.log("cumul", i, acc.length);
});
fs.writeFileSync(path.join(__dirname, "chunks", "b64_final.txt"), acc + runner);
console.log("final", (acc + runner).length, "steps", steps, "runner", runner.length);
