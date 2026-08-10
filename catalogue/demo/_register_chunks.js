/**
 * Split embed into register_inline_script-sized pieces (<=1800 char source).
 * Prints JSON array of {display_name, version, source_code} for MCP registration.
 */
const fs = require("fs");
const path = require("path");
const c = fs.readFileSync(path.join(__dirname, "chunks", "for_htmlembed.txt"), "utf8");
const b64 = Buffer.from(c, "utf8").toString("base64");
const chunkSize = 1200;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

const scripts = chunks.map((ch, i) => {
  const source_code =
    "window.__AM_CAT_B64=window.__AM_CAT_B64||[];window.__AM_CAT_B64[" +
    i +
    "]=" +
    JSON.stringify(ch) +
    ";";
  return {
    display_name: "AmCat" + String(i).padStart(2, "0"),
    version: "1.0." + i,
    source_code,
    len: source_code.length,
  };
});

const runner = {
  display_name: "AmCatRun",
  version: "1.0.0",
  source_code: `(function(){
var p=window.__AM_CAT_B64||[];
if(!p.length)return;
var html=atob(p.join(""));
var root=document.getElementById("am-cat-mount");
if(!root){root=document.createElement("div");root.id="am-cat-mount";document.body.appendChild(root);}
var tmp=document.createElement("div");
tmp.innerHTML=html;
var scripts=[];
Array.from(tmp.childNodes).forEach(function(n){
if(n.nodeType===1&&n.tagName==="SCRIPT")scripts.push(n.textContent);
else root.appendChild(n);
});
scripts.forEach(function(code){var s=document.createElement("script");s.textContent=code;document.body.appendChild(s);});
})();`,
};

scripts.push({ ...runner, len: runner.source_code.length });

fs.writeFileSync(
  path.join(__dirname, "chunks", "register_scripts.json"),
  JSON.stringify({ scripts, count: scripts.length }, null, 2)
);
console.log(
  JSON.stringify({
    chunks: chunks.length,
    totalScripts: scripts.length,
    maxLen: Math.max(...scripts.map((s) => s.len)),
  })
);
