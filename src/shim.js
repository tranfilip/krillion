// Náhrada za funkce, které hra dostává uvnitř claude.ai.
// - "sample" (hodnocení a vymýšlení otázek Claudem) volá vlastní server /api/ai.
//   Když server neběží nebo nemá API klíč, hra jede jen na vestavěných seznamech.
// - "db" a "user" tu nejsou: paměť a rekord se ukládají v prohlížeči (localStorage).
(function () {
  const ENDPOINT = "/api/ai";
  let available = null;

  async function check() {
    if (available !== null) return available;
    try {
      const r = await fetch(ENDPOINT, { method: "GET" });
      const j = r.ok ? await r.json() : null;
      available = !!(j && j.ok);
    } catch (e) {
      available = false;
    }
    return available;
  }

  async function sample(prompt, opts) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: String(prompt), tier: (opts && opts.modelTier) || "quick" })
    });
    if (r.status === 429) throw { code: "rate_limited" };
    if (!r.ok) throw { code: "error" };
    const j = await r.json();
    return { text: String(j.text || ""), truncated: false };
  }
  sample.json = async function (prompt, opts) {
    const { text } = await sample(prompt, opts);
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw { code: "parse" };
    return JSON.parse(m[0]);
  };

  window.claude = {
    use: async function (name) {
      if (name === "sample") return (await check()) ? sample : null;
      return null;
    }
  };
})();
