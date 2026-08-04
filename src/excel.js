function library() {
  if (!window.XLSX) throw new Error("Excel機能を読み込めませんでした。通信環境を確認してください");
  return window.XLSX;
}

export async function readKalodataWorkbook(file) {
  const XLSX = library();
  const workbook = XLSX.read(await file.arrayBuffer(), { type:"array", cellDates:false });
  const sheetName = workbook.SheetNames.includes("LIST_PRODUCT") ? "LIST_PRODUCT" : workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excelファイルにシートがありません");
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval:"", raw:true });
}

export function downloadWorkbook(items) {
  const XLSX = library();
  const rows = items.map((item, index) => ({
    "順位": index + 1,
    "商品名称": item.name,
    "画像リンク": item.imageUrl || "",
    "カテゴリー": item.fullCategory,
    "価格(¥)": item.price,
    "送料(¥)": item.shipping || 0,
    "販売数": item.sales,
    "取引金額 (¥)": item.gmv,
    "売上高成長率": item.growthLabel,
    "ライブ取引金額 (¥)": item.liveGmv || 0,
    "動画取引金額 (¥)": item.videoGmv || 0,
    "商品カード売上": item.cardGmv || 0,
    "クリエイター数": item.creators || 0,
    "スコア": item.score,
    "Kalodata詳細リンク": item.detailUrl || "",
    "TikTokリンク": item.tiktokUrl || ""
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{wch:7},{wch:52},{wch:32},{wch:38},{wch:12},{wch:12},{wch:12},{wch:18},{wch:16},{wch:20},{wch:20},{wch:20},{wch:14},{wch:10},{wch:48},{wch:48}];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "PRODUCTS");
  XLSX.writeFileXLSX(workbook, `kalo-trend-${new Date().toISOString().slice(0,10)}.xlsx`);
}
