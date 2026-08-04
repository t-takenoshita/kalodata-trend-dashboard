import { readKalodataWorkbook, downloadWorkbook } from "./excel.js";
import { adaptKalodataRows } from "./kalodata-adapter.js";
import { sampleProducts } from "./sample-data.js";

let products = sampleProducts;
let currentPage = 1;
let pageSize = 10;
const yen = value => new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(value);
const num = value => new Intl.NumberFormat("ja-JP").format(value);
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const elements = {search:document.querySelector("#search"),category:document.querySelector("#category"),sort:document.querySelector("#sort"),rows:document.querySelector("#productRows"),empty:document.querySelector("#empty"),input:document.querySelector("#excelInput, #csvInput"),status:document.querySelector("#dataStatus"),pagination:document.querySelector("#pagination"),pageNumbers:document.querySelector("#pageNumbers"),prev:document.querySelector("#prevPage"),next:document.querySelector("#nextPage"),pageSize:document.querySelector("#pageSize"),pageJump:document.querySelector("#pageJump")};
if (elements.input) elements.input.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

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
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const pageRows = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  elements.rows.innerHTML = pageRows.map((item,index) => { const rank=(currentPage-1)*pageSize+index+1; return `<tr><td class="rank ${rank<=3?"top":""}">${String(rank).padStart(2,"0")}</td><td><div class="product-cell">${productVisual(item)}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.subtitle)}</small></span></div></td><td><span class="category-pill">${escapeHtml(item.category)}</span></td><td>${yen(item.price)}</td><td>${num(item.sales)}</td><td><strong>${yen(item.gmv)}</strong></td><td class="growth ${item.growth<0?"down":""}">${escapeHtml(item.growthLabel)}</td><td><span class="score"><b>${item.score}</b><i style="--score:${item.score}%"></i></span></td></tr>`; }).join("");
  elements.rows.querySelectorAll("img.product-icon").forEach(image => image.addEventListener("error", () => {
    const fallback = document.createElement("span"); fallback.className = "product-icon"; fallback.textContent = "↗"; fallback.style.setProperty("--icon-bg", "#edf2ed"); image.replaceWith(fallback);
  }, { once:true }));
  elements.empty.hidden = data.length > 0; document.querySelector(".table-wrap").hidden = data.length === 0;
  document.querySelector("#resultCount").textContent = `${data.length} PRODUCTS`; document.querySelector("#metricProducts").textContent = data.length;
  document.querySelector("#metricGmv").textContent = data.length ? `¥${(data.reduce((sum,item)=>sum+item.gmv,0)/1e6).toFixed(2)}M` : "—";
  const avg = data.length ? Math.round(data.reduce((sum,item)=>sum+item.growth,0)/data.length) : 0; document.querySelector("#metricGrowth").textContent = data.length ? `${avg>=0?"+":""}${avg}%` : "—";
  renderSparkline(data.length ? Math.round(data.reduce((sum,item)=>sum+item.score,0)/data.length) : 0);
  if (elements.pagination) renderPagination(data.length, totalPages);
}

function paginationItems(totalPages) {
  if (totalPages <= 7) return Array.from({length:totalPages},(_,index)=>index+1);
  const pages = new Set([1,totalPages,currentPage-1,currentPage,currentPage+1]);
  const sorted = [...pages].filter(page=>page>=1&&page<=totalPages).sort((a,b)=>a-b); const result=[];
  sorted.forEach((page,index)=>{ if(index&&page-sorted[index-1]>1) result.push("…"); result.push(page); }); return result;
}

function renderPagination(totalItems, totalPages) {
  elements.pagination.hidden = totalItems === 0;
  elements.prev.disabled = currentPage === 1; elements.next.disabled = currentPage === totalPages;
  elements.pageNumbers.innerHTML = paginationItems(totalPages).map(item=>item==="…"?'<span class="page-ellipsis">…</span>':`<button class="${item===currentPage?"active":""}" data-page="${item}" ${item===currentPage?'aria-current="page"':""}>${item}</button>`).join("");
  elements.pageJump.max = totalPages; elements.pageJump.value = currentPage;
}

function renderSparkline(base) {
  const values=[.58,.62,.6,.68,.65,.73,.71,.78,.76,.85,.83,1].map(value=>Math.round(base*value)); const points=values.map((value,index)=>`${index*(100/(values.length-1))},${70-value*.62}`).join(" ");
  document.querySelector("#sparkline").innerHTML=`<svg viewBox="0 0 100 75" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21c16b" stop-opacity=".3"/><stop offset="1" stop-color="#21c16b" stop-opacity="0"/></linearGradient></defs><polygon points="0,75 ${points} 100,75" fill="url(#fill)"/><polyline points="${points}" fill="none" stroke="#21c16b" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

async function importExcel(file) {
  try {
    const rows = await readKalodataWorkbook(file); const imported = adaptKalodataRows(rows);
    if (!imported.length || !rows[0]?.["商品名称"]) throw new Error("KaloDataの商品Excelとして認識できませんでした");
    products = imported; elements.search.value = ""; elements.category.value = "all"; populateCategories(); render();
    if (elements.status) { elements.status.innerHTML = `<span></span> LOCAL EXCEL · ${products.length} ITEMS`; elements.status.title = `${file.name}（端末内処理）`; }
  } catch (error) { window.alert(error.message); }
}

[elements.search,elements.category,elements.sort].forEach(element=>element.addEventListener("input",()=>{currentPage=1;render();}));
if (elements.input) elements.input.addEventListener("change",event=>event.target.files[0]&&importExcel(event.target.files[0]));
document.querySelector("#export").addEventListener("click",()=>downloadWorkbook(currentData()));
elements.prev?.addEventListener("click",()=>{if(currentPage>1){currentPage--;render();}});
elements.next?.addEventListener("click",()=>{const pages=Math.max(1,Math.ceil(currentData().length/pageSize));if(currentPage<pages){currentPage++;render();}});
elements.pageNumbers?.addEventListener("click",event=>{const page=Number(event.target.closest("button")?.dataset.page);if(page){currentPage=page;render();}});
elements.pageSize?.addEventListener("change",event=>{pageSize=Number(event.target.value);currentPage=1;render();});
elements.pageJump?.addEventListener("change",event=>{const pages=Math.max(1,Math.ceil(currentData().length/pageSize));currentPage=Math.min(pages,Math.max(1,Number(event.target.value)||1));render();});
populateCategories(); render();
