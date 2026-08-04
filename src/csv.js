export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift()?.map(value => value.trim()) ?? [];
  return rows.filter(values => values.some(Boolean)).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

export function toCsv(rows) {
  const headers = ["順位","商品名称","カテゴリー","価格(¥)","販売数","取引金額 (¥)","売上高成長率","スコア","Kalodata詳細リンク","TikTokリンク"];
  const values = rows.map((item, index) => [index + 1,item.name,item.fullCategory,item.price,item.sales,item.gmv,item.growthLabel,item.score,item.detailUrl,item.tiktokUrl]);
  return "\uFEFF" + [headers, ...values].map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}
