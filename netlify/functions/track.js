const { h, u, j } = require("./_db");
exports.handler = async e => {
  const q = e.queryStringParameters || {};
  const code = String(q.code || "").replace(/\D/g, ""), ph = String(q.phone || "").replace(/\D/g, "").slice(-9);
  if (code.length !== 6 || ph.length < 9) return j(404, {});
  const r = await fetch(u + `orders?code=eq.${code}&select=status,phone`, { headers: h }).then(r => r.json()).catch(() => []);
  const o = Array.isArray(r) && r.find(x => x.phone.replace(/\D/g, "").slice(-9) === ph);
  return o ? j(200, { status: o.status }) : j(404, {});
};
