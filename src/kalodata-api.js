import { adaptKalodataApiProducts } from "./kalodata-adapter.js";
import { API_MODE, API_PROXY_URL } from "./api-config.js";

export const apiIsConfigured = () => API_MODE === "github-snapshot" || Boolean(API_PROXY_URL);

async function fetchSnapshot(dateRange) {
  const presetNames = { lastDay:"last-day", last7Day:"last-7-day", last30Day:"last-30-day" };
  const name = presetNames[dateRange] || "custom";
  const url = new URL(`../data/product-rank-${name}.json`, import.meta.url);
  url.searchParams.set("v", Date.now());
  const response = await fetch(url);
  if (!response.ok) throw new Error("取得済みAPIデータがありません。GitHub Actionsを実行してください");
  const payload = await response.json();
  if (name === "custom" && payload.dateRange !== dateRange) throw new Error(`カスタム期間の取得済みデータは ${payload.dateRange || "未設定"} です`);
  return adaptKalodataApiProducts(payload.data || []);
}

export async function fetchProductRanking({ dateRange, pageSize = 100, pageNumber = 1, keyword = "" }) {
  if (API_MODE === "github-snapshot") return fetchSnapshot(dateRange);
  if (!API_PROXY_URL) throw new Error("API中継URLが未設定です");
  const response = await fetch(API_PROXY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      region: "JP", language: "ja-JP", currency: "JPY", date_range: dateRange,
      sort_field: { field: "revenue", type: "DESC" },
      page_size: Math.min(100, pageSize), page_number: pageNumber,
      need_image: 1, need_extra: true, ...(keyword ? { keyword } : {}),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.message || `KaloData APIエラー（${response.status}）`);
  return adaptKalodataApiProducts(payload.data || []);
}
