const { h, u, j } = require("./_db");
exports.handler = async () => {
  try {
    const r = await fetch(u + "products?active=eq.true&order=id&select=*", { headers: h });
    if (!r.ok) return j(502, []);
    return j(200, await r.json(), { "Cache-Control": "public, max-age=60" });
  } catch { return j(502, []); }
};
