import { mkdir, writeFile } from "node:fs/promises";

const endpoint = "https://www.kalodata.com/openapi/v1/tiktok/product/rank";
const secretKey = process.env.KALODATA_SECRET_KEY;
if (!secretKey) throw new Error("KALODATA_SECRET_KEY is required");

const targets = [
  ["lastDay", "last-day"],
  ["last7Day", "last-7-day"],
  ["last30Day", "last-30-day"],
];
const custom = process.env.CUSTOM_DATE_RANGE?.trim();
if (custom) {
  if (!/^\d{4}-\d{2}-\d{2}~\d{4}-\d{2}-\d{2}$/.test(custom)) throw new Error("CUSTOM_DATE_RANGE must be yyyy-MM-dd~yyyy-MM-dd");
  targets.push([custom, "custom"]);
}

await mkdir("data", { recursive:true });
for (const [dateRange, fileName] of targets) {
  const response = await fetch(endpoint, {
    method:"POST",
    headers:{ "content-type":"application/json", "secret-key":secretKey },
    body:JSON.stringify({
      region:"JP", language:"ja-JP", currency:"JPY", date_range:dateRange,
      sort_field:{ field:"revenue", type:"DESC" }, page_size:100, page_number:1,
      need_image:1, need_extra:true,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(`KaloData ${dateRange}: ${payload.message || response.status}`);
  const output = { generatedAt:new Date().toISOString(), dateRange, count:payload.data?.length || 0, data:payload.data || [] };
  await writeFile(`data/product-rank-${fileName}.json`, `${JSON.stringify(output)}\n`);
  console.log(`Saved ${dateRange}: ${output.count} products`);
}
