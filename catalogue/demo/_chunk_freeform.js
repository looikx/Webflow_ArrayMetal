const fs = require("fs");
const path = require("path");
const c = fs.readFileSync(path.join(__dirname, "chunks", "for_htmlembed.txt"), "utf8");
const size = Math.ceil(c.length / 3);
const parts = [c.slice(0, size), c.slice(size, size * 2), c.slice(size * 2)];

parts.forEach((p, i) => {
  const content =
    "<script>window.__AM_CAT=window.__AM_CAT||[];window.__AM_CAT[" +
    i +
    "]=" +
    JSON.stringify(p) +
    ";</script>";
  fs.writeFileSync(path.join(__dirname, "chunks", "freeform_step" + i + ".txt"), content);
  console.log("step", i, "len", content.length);
});

const runner = `<script>
(function(){
  var parts = window.__AM_CAT || [];
  if (parts.length < 3) { console.error("AM cat incomplete", parts.length); return; }
  var html = parts.join("");
  var mount = document.createElement("div");
  mount.id = "am-cat-root";
  var anchor = document.currentScript;
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(mount, anchor);
  else document.body.appendChild(mount);
  var tmp = document.createElement("div");
  tmp.innerHTML = html;
  var scripts = [];
  Array.from(tmp.childNodes).forEach(function(n){
    if (n.nodeType === 1 && n.tagName === "SCRIPT") scripts.push(n.textContent);
    else mount.appendChild(n);
  });
  scripts.forEach(function(code){
    var s = document.createElement("script");
    s.textContent = code;
    document.body.appendChild(s);
  });
})();
</script>`;

fs.writeFileSync(path.join(__dirname, "chunks", "freeform_runner.txt"), runner);
console.log("runner", runner.length);
