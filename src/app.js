import { parseCsv, toCsv } from "./csv.js";
import { adaptKalodataRows } from "./kalodata-adapter.js";
import { sampleProducts } from "./sample-data.js";

let products = sampleProducts;
const yen = value => new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(value);
const num = value => new Intl.NumberFormat("ja-JP").format(value);
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const elements = {search:document.querySelector("#search"),category:document.querySelector("#category"),sort:document.querySelector("#sort"),rows:document.querySelector("#productRows"),empty:document.querySelector("#empty"),input:document.querySelector("#csvInput"),status:document.querySelector("#dataStatus")};

function populateCategories() {
  const selected = elements.category.value;
  elements.category.innerHTML = '<option value="all">すべて</option>';
  [...new Set(products.map(item => item.category))].sort().forEach(category => elements.category.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`));
  if ([...elements.category.options].some(option => option.value === selected)) elements.category.value = selected;
}

function currentData() {
  const query = elements.search.value.trim().toLowerCase();
  return products.filter(item => (elements.category.value === "all" || item.category === elements.category.value) && (!query || `${item.name} ${item.fullCategory}`.toLowerCase().includes(query))).sort((a,b) => b[elements.sort.value] - a[elements.sort.value]);
}

function productVisual(item) {
  return item.imageUrl ? `<img class="product-icon" src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="product-icon" style="--icon-bg:${item.color}">${item.icon}</span>`;
}

function render() {
  const data = currentData();
  elements.rows.innerHTML = data.map((item,index) => `<tr><td class="rank ${index<3?"top":""}">${String(index+1).padStart(2,"0")}</td><td><div class="product-cell">${productVisual(item)}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.subtitle)}</small></span></div></td><td><span class="category-pill">${escapeHtml(item.category)}</span></td><td>${yen(item.price)}</td><td>${num(item.sales)}</td><td><strong>${yen(item.gmv)}</strong></td><td class="growth ${item.growth<0?"down":""}">${escapeHtml(item.growthLabel)}</td><td><span class="score"><b>${item.score}</b><i style="--score:${item.score}%"></i></span></td></tr>`).join("");
  elements.rows.querySelectorAll("img.product-icon").forEach(image => image.addEventListener("error", () => {
    const fallback = document.createElement("span"); fallback.className = "product-icon"; fallback.textContent = "↗"; fallback.style.setProperty("--icon-bg", "#edf2ed"); image.replaceWith(fallback);
  }, { once:true }));
  elements.empty.hidden = data.length > 0; document.querySelector(".table-wrap").hidden = data.length === 0;
  document.querySelector("#resultCount").textContent = `${data.length} PRODUCTS`; document.querySelector("#metricProducts").textContent = data.length;
  document.querySelector("#metricGmv").textContent = data.length ? `¥${(data.reduce((sum,item)=>sum+item.gmv,0)/1e6).toFixed(2)}M` : "—";
  const avg = data.length ? Math.round(data.reduce((sum,item)=>sum+item.growth,0)/data.length) : 0; document.querySelector("#metricGrowth").textContent = data.length ? `${avg>=0?"+":""}${avg}%` : "—";
  renderSparkline(data.length ? Math.round(data.reduce((sum,item)=>sum+item.score,0)/data.length) : 0);
}

function renderSparkline(base) {
  const values=[.58,.62,.6,.68,.65,.73,.71,.78,.76,.85,.83,1].map(value=>Math.round(base*value)); const points=values.map((value,index)=>`${index*(100/(values.length-1))},${70-value*.62}`).join(" ");
  document.querySelector("#sparkline").innerHTML=`<svg viewBox="0 0 100 75" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21c16b" stop-opacity=".3"/><stop offset="1" stop-color="#21c16b" stop-opacity="0"/></linearGradient></defs><polygon points="0,75 ${points} 100,75" fill="url(#fill)"/><polyline points="${points}" fill="none" stroke="#21c16b" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

async function importCsv(file) {
  try {
    const rows = parseCsv(await file.text()); const imported = adaptKalodataRows(rows);
    if (!imported.length || !rows[0]?.["商品名称"]) throw new Error("KaloDataの商品CSVとして認識できませんでした");
    products = imported; elements.search.value = ""; elements.category.value = "all"; populateCategories(); render();
    elements.status.innerHTML = `<span></span> LOCAL CSV · ${products.length} ITEMS`; elements.status.title = `${file.name}（端末内処理）`;
  } catch (error) { window.alert(error.message); }
}

function exportCsv() {
  const url=URL.createObjectURL(new Blob([toCsv(currentData())],{type:"text/csv;charset=utf-8"})); const anchor=document.createElement("a"); anchor.href=url; anchor.download=`kalo-trend-${new Date().toISOString().slice(0,10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

[elements.search,elements.category,elements.sort].forEach(element=>element.addEventListener("input",render));
elements.input.addEventListener("change",event=>event.target.files[0]&&importCsv(event.target.files[0]));
document.querySelector("#export").addEventListener("click",exportCsv);
populateCategories(); render();
