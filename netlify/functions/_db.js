const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_KEY;
exports.h = { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json" };
exports.u = U + "/rest/v1/";
exports.j = (c, b, x = {}) => ({ statusCode: c, headers: { "Content-Type": "application/json", ...x }, body: JSON.stringify(b) });
