const fs = require("fs");
const path = require("path");
const d = require("./chunks/register_scripts.json");
const batchSize = 4;
const batches = [];
for (let i = 0; i < d.scripts.length; i += batchSize) {
  const slice = d.scripts.slice(i, i + batchSize);
  const actions = slice.map((s) => ({
    label: "reg " + s.display_name,
    register_inline_script: {
      site_id: "6082b34dc5995b3e8dc8c73b",
      source_code: s.source_code,
      version: s.version,
      display_name: s.display_name,
      can_copy: true,
    },
  }));
  const file = path.join(__dirname, "chunks", "reg_batch_" + batches.length + ".json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      actions,
      context: "Register catalogue embed scripts batch " + batches.length,
    })
  );
  batches.push({ file, count: actions.length, names: slice.map((s) => s.display_name) });
}
// also write apply list
const apply = d.scripts.map((s, i) => ({
  id: s.display_name.toLowerCase(),
  location: "footer",
  version: s.version,
}));
fs.writeFileSync(
  path.join(__dirname, "chunks", "apply_scripts.json"),
  JSON.stringify({ scripts: apply }, null, 2)
);
console.log(JSON.stringify({ batches: batches.length, total: d.scripts.length, batchMeta: batches }, null, 2));
