const { h, u, j } = require("./_db");
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const fm = n => n.toLocaleString("ru-RU");

exports.handler = async e => {
    if (e.httpMethod !== "POST") return j(405, {});
    let d;
    try { d = JSON.parse(e.body); } catch { return j(400, {}); }
    const first = String(d.first_name || "").trim().slice(0, 60),
        last = String(d.last_name || "").trim().slice(0, 60);
    const addr = String(d.address || "").trim().slice(0, 300),
        phone = String(d.phone || "").replace(/[^\d+]/g, "").slice(0, 16);
    if (!first || !last || !addr || phone.replace(/\D/g, "").length < 9 || !Array.isArray(d.items) || !d.items.length || d.items.length > 30) return j(400, {});

    const ids = [...new Set(d.items.map(i => +i.id))].filter(Number.isInteger);
    if (!ids.length) return j(400, {});
    const pr = await fetch(u + `products?id=in.(${ids.join(",")})&active=eq.true&select=id,name_uz,price`, { headers: h }).then(r => r.json());

    let total = 0;
    const items = [];
    for (const i of d.items) {
        const p = Array.isArray(pr) && pr.find(x => x.id === +i.id);
        if (!p) return j(400, {});
        const qty = Math.min(Math.max(parseInt(i.qty) || 1, 1), 20);
        total += p.price * qty;
        items.push({ id: p.id, name: p.name_uz, size: String(i.size || "").slice(0, 10), color: String(i.color || "").slice(0, 10), qty, price: p.price });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const lat = Number.isFinite(+d.lat) && d.lat !== null ? +d.lat : null,
        lng = Number.isFinite(+d.lng) && d.lng !== null ? +d.lng : null;

    const ins = await fetch(u + "orders", {
        method: "POST",
        headers: {...h, Prefer: "return=minimal" },
        body: JSON.stringify({ code, first_name: first, last_name: last, phone, address: addr, lat, lng, items, total })
    });
    if (!ins.ok) return j(502, {});

    const text = `🛍 <b>Yangi buyurtma #${code}</b>\n👤 ${esc(first)} ${esc(last)}\n📞 ${esc(phone)}\n📍 ${esc(addr)}` +
        (lat !== null ? `\n🗺 https://www.google.com/maps?q=${lat},${lng}` : "") +
        `\n\n` + items.map(i => `• ${esc(i.name)} (${esc(i.size)}) × ${i.qty} — ${fm(i.price * i.qty)}`).join("\n") +
        `\n\n💰 <b>Jami: ${fm(total)} soʻm</b>`;
    try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true })
        });
    } catch (err) { console.error("telegram", err); }
    return j(200, { code });
};