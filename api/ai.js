// Serverless funkce pro Vercel: /api/ai
// Posílá hře odpovědi od Clauda přes Anthropic API. Klíč je jen na serveru
// (proměnná prostředí ANTHROPIC_API_KEY), do prohlížeče se nikdy nedostane.

const MODELS = {
  quick: "claude-haiku-5-5",   // vymýšlení otázek – rychlé a levné
  default: "claude-sonnet-5-5" // hodnocení odpovědí – přesnější
};

// Server přijme jen prompty, které posílá samotná hra, aby nešel zneužít
// jako bezplatný přístup ke Claudovi.
const ALLOWED_PREFIXES = [
  "Jsi rozhodčí české trivia hry Krillion.",
  "Vymýšlíš zadání pro českou trivia hru Krillion."
];

// Jednoduchý limit na IP adresu (v rámci jedné běžící instance funkce).
const hits = new Map();
const LIMIT = 60;          // požadavků
const WINDOW_MS = 10 * 60e3; // za 10 minut

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > LIMIT;
}

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method === "GET") {
    return res.status(200).json({ ok: !!key });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!key) return res.status(503).json({ error: "no_key" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const prompt = String(body.prompt || "");
  const tier = body.tier === "default" ? "default" : "quick";

  if (prompt.length > 8000 || !ALLOWED_PREFIXES.some((p) => prompt.startsWith(p))) {
    return res.status(400).json({ error: "bad_prompt" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env[tier === "default" ? "MODEL_JUDGE" : "MODEL_QUICK"] || MODELS[tier],
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (r.status === 429) return res.status(429).json({ error: "rate_limited" });
    if (!r.ok) return res.status(502).json({ error: "upstream", status: r.status });
    const j = await r.json();
    const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "upstream" });
  }
}
