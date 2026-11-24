const siteOrigin = "https://yunzhegao.github.io";

const recordVisit = `
  INSERT INTO country_visits (country, views, first_seen)
  VALUES (?, 1, ?)
  ON CONFLICT(country) DO UPDATE SET
    views = country_visits.views + 1,
    first_seen = MIN(country_visits.first_seen, excluded.first_seen)
`;

const readVisits = `
  SELECT country AS code, views, first_seen
  FROM country_visits
  ORDER BY views DESC, country
`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const headers = {
      "Access-Control-Allow-Origin": siteOrigin,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };

    if (new URL(request.url).pathname !== "/visits") {
      return new Response(null, { status: 404, headers });
    }
    if (origin && origin !== siteOrigin) {
      return new Response(null, { status: 403, headers });
    }

    try {
      if (request.method === "POST") {
        if (origin !== siteOrigin) return new Response(null, { status: 403, headers });

        const userAgent = request.headers.get("User-Agent") ?? "";
        if (/bot\b|crawler\b|spider\b|headlesschrome\b|lighthouse\b/i.test(userAgent)) {
          return new Response(null, { status: 204, headers });
        }

        const country = request.cf?.country ?? "";
        const code = /^[A-Z]{2}$/.test(country) ? country : "XX";
        await env.VISITS.prepare(recordVisit).bind(code, Date.now()).run();
        return new Response(null, { status: 204, headers });
      }

      if (request.method === "GET") {
        const { results } = await env.VISITS.prepare(readVisits).all();
        let total = 0;
        let firstSeen = Infinity;
        const countries = results.map(({ code, views, first_seen }) => {
          total += views;
          firstSeen = Math.min(firstSeen, first_seen);
          return { code, views };
        });
        const since = countries.length ? new Date(firstSeen).toISOString() : null;
        return Response.json({ total, since, countries }, { headers });
      }

      return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, POST" } });
    } catch {
      return new Response(null, { status: 503, headers });
    }
  },
};
