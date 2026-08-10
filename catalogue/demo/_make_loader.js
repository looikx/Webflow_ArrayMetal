const fs = require("fs");
const path = require("path");

const c = fs.readFileSync(path.join(__dirname, "catalogue-embed.min.html"), "utf8");
const b64 = Buffer.from(c, "utf8").toString("base64");
const chunkSize = 1200;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

const wAssigns = chunks.map((ch, i) => `W[${i}]="${ch}";`).join("\n");

const loader = `<div id="am-cat-mount"></div>
<script>
(function(){
var W=[];
${wAssigns}
var raw=atob(W.join(""));
var mount=document.getElementById("am-cat-mount");
var tmp=document.createElement("div");
tmp.innerHTML=raw;
var scripts=[];
Array.prototype.slice.call(tmp.childNodes).forEach(function(n){
  if(n.nodeType===1 && n.tagName==="SCRIPT"){ scripts.push(n.textContent); }
  else if(n.nodeType===1 && n.tagName==="STYLE"){ document.head.appendChild(n); }
  else { mount.appendChild(n); }
});
scripts.forEach(function(code){
  var s=document.createElement("script");
  s.textContent=code;
  document.body.appendChild(s);
});
})();
</script>
`;

const out = path.join(__dirname, "catalogue-embed-loader.html");
fs.writeFileSync(out, loader, "utf8");
console.log("loader len", loader.length, "chunks", chunks.length);
