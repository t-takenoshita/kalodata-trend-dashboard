const asNumber = value => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[¥,%>+,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const growthValue = value => {
  const text = String(value ?? "").trim();
  const number = asNumber(text);
  return text.startsWith("-") ? -Math.abs(number) : number;
};

const scoreProducts = products => {
  const maxSales = Math.max(...products.map(item => item.sales), 1);
  const maxGmv = Math.max(...products.map(item => item.gmv), 1);
  const maxGrowth = Math.max(...products.map(item => Math.max(item.growth, 0)), 1);
  return products.map(item => ({ ...item, score: Math.round(100 * (.38 * Math.log1p(item.gmv) / Math.log1p(maxGmv) + .32 * Math.log1p(item.sales) / Math.log1p(maxSales) + .30 * Math.max(item.growth, 0) / maxGrowth)) }));
};

export function adaptKalodataRows(rows) {
  return scoreProducts(rows.map((row, index) => {
    const fullCategory = row["カテゴリー"] || "未分類";
    const growthLabel = row["売上高成長率"] || "0%";
    return {
      id: row["Kalodata詳細リンク"]?.match(/id=(\d+)/)?.[1] || `row-${index + 1}`,
      name: row["商品名称"] || "名称未設定", subtitle: row["アップロード時間"] ? `登録 ${row["アップロード時間"]}` : "KaloData商品",
      category: fullCategory.split(">")[0].trim(), fullCategory, imageUrl: row["画像リンク"] || "",
      price: asNumber(row["価格(¥)"]), shipping: asNumber(row["送料(¥)"]), sales: asNumber(row["販売数"]), gmv: asNumber(row["取引金額 (¥)"]),
      growth: growthValue(growthLabel), growthLabel, liveGmv: asNumber(row["ライブ取引金額 (¥)"]), videoGmv: asNumber(row["動画取引金額 (¥)"]), cardGmv: asNumber(row["商品カード売上"]),
      creators: asNumber(row["クリエイター数"]), detailUrl: row["Kalodata詳細リンク"] || "", tiktokUrl: row["TikTokリンク"] || "",
      icon: "↗", color: ["#dff7e8","#e5f1ff","#ffe6e4","#f0e8ff","#fff0d8"][index % 5],
    };
  }));
}
