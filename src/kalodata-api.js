import { adaptKalodataApiProducts } from "./kalodata-adapter.js";
import { API_PROXY_URL } from "./api-config.js";

export const apiIsConfigured = () => Boolean(API_PROXY_URL);

export async function fetchProductRanking({ dateRange, pageSize = 100, pageNumber = 1, keyword = "" }) {
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
