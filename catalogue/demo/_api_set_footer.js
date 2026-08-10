/**
 * Set draft page freeform footer via Webflow REST API.
 * Token read from local MCP credentials (not printed).
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const PAGE_ID = "6a71fa9149bd0b583281bdf3";
const SITE_ID = "6082b34dc5995b3e8dc8c73b";

const creds = JSON.parse(
  fs.readFileSync(
    path.join(process.env.USERPROFILE || process.env.HOME, ".grok", "mcp_credentials.json"),
    "utf8"
  )
);
const token =
  creds["webflow:https://mcp.webflow.com/mcp"]?.token_response?.access_token;
if (!token) {
  console.error("no webflow token");
  process.exit(1);
}

const content = fs.readFileSync(
  path.join(__dirname, "chunks", "part_body.txt"),
  "utf8"
);

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "api.webflow.com",
        path: urlPath,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
          "content-type": "application/json",
          ...(data
            ? { "content-length": Buffer.byteLength(data) }
            : {}),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: buf.slice(0, 2000) });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  // Try known freeform / custom code endpoints
  const attempts = [
    {
      name: "put freeform footer v2 beta",
      method: "PUT",
      path: `/v2/pages/${PAGE_ID}/custom_code`,
      body: {
        scripts: [],
      },
    },
    {
      name: "patch page freeform",
      method: "PATCH",
      path: `/v2/pages/${PAGE_ID}`,
      body: {
        customCode: {
          footer: content,
        },
      },
    },
    {
      name: "put page freeform footer",
      method: "PUT",
      path: `/v2/pages/${PAGE_ID}/custom_code/freeform`,
      body: {
        location: "footer",
        content,
      },
    },
    {
      name: "put freeform footer sites path",
      method: "PUT",
      path: `/v2/sites/${SITE_ID}/pages/${PAGE_ID}/custom_code`,
      body: {
        footer: content,
      },
    },
  ];

  for (const a of attempts) {
    const r = await request(a.method, a.path, a.body);
    console.log(a.name, r.status, r.body.slice(0, 300).replace(/\n/g, " "));
  }
})();
