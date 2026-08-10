const fs = require("fs");
const path = require("path");
const code = fs.readFileSync(path.join(__dirname, "catalogue-embed.html"), "utf8");
const b64 = Buffer.from(code, "utf8").toString("base64");
const chunk = 8000;
const parts = [];
for (let i = 0; i < b64.length; i += chunk) parts.push(b64.slice(i, i + chunk));
console.log("parts", parts.length, parts.map((p) => p.length));

parts.forEach((p, i) => {
  const c =
    "<script>window.__AM_CAT_B64=window.__AM_CAT_B64||[];window.__AM_CAT_B64[" +
    i +
    "]=" +
    JSON.stringify(p) +
    ";</script>";
  fs.writeFileSync(path.join(__dirname, "chunks", "ff" + i + ".txt"), c);
  console.log("ff" + i, c.length);
});

const runner =
  "<script>(function(){var p=window.__AM_CAT_B64||[];if(p.length<" +
  parts.length +
  '){console.error("incomplete",p.length);return;}var html=atob(p.join(""));var root=document.getElementById("am-cat-mount");if(!root){root=document.createElement("div");root.id="am-cat-mount";document.body.insertBefore(root,document.body.firstChild);}var tmp=document.createElement("div");tmp.innerHTML=html;var scripts=[];Array.from(tmp.childNodes).forEach(function(n){if(n.nodeType===1&&n.tagName==="SCRIPT")scripts.push(n.textContent);else root.appendChild(n);});scripts.forEach(function(code){var s=document.createElement("script");s.textContent=code;document.body.appendChild(s);});})();</script>';
fs.writeFileSync(path.join(__dirname, "chunks", "ff_runner.txt"), runner);
console.log("runner", runner.length);
