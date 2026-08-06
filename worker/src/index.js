const KALODATA_ENDPOINT = "https://www.kalodata.com/openapi/v1/tiktok/product/rank";
const allowedFields = new Set(["region","language","currency","date_range","sort_field","page_size","page_number","category_ids","revenue_range","is_affiliate","commission_rate","is_tts_product","unit_price_range","need_all","delivery_type","launch_date","need_image","keyword","need_extra"]);

function cors(origin, allowedOrigin) {
  return { "access-control-allow-origin": allowedOrigin === "*" ? "*" : origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "vary": "Origin" };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://t-takenoshita.github.io";
    const headers = cors(origin, allowedOrigin);
    if (allowedOrigin !== "*" && origin !== allowedOrigin) return new Response("Forbidden", { status: 403, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return Response.json({ success:false, message:"Method not allowed" }, { status:405, headers });
    if (!env.KALODATA_SECRET_KEY) return Response.json({ success:false, message:"WorkerのAPIキーが未設定です" }, { status:500, headers });
    try {
      const input = await request.json();
      const body = Object.fromEntries(Object.entries(input).filter(([key]) => allowedFields.has(key)));
      body.region = "JP"; body.language = "ja-JP"; body.currency = "JPY";
      body.page_size = Math.min(100, Math.max(1, Number(body.page_size) || 20));
      body.page_number = Math.max(1, Number(body.page_number) || 1);
      const upstream = await fetch(KALODATA_ENDPOINT, { method:"POST", headers:{ "content-type":"application/json", "secret-key":env.KALODATA_SECRET_KEY }, body:JSON.stringify(body) });
      return new Response(await upstream.text(), { status:upstream.status, headers:{...headers,"content-type":"application/json; charset=utf-8"} });
    } catch (error) {
      return Response.json({ success:false, message:error.message || "Proxy error" }, { status:400, headers });
    }
  },
};
