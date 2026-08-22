/**
 * 生成软著提交用的 60 页源程序文档（前 30 页 + 后 30 页，每页 50 行）。
 *
 * 使用方式：
 *   node scripts/generate-softcopyright-source.mjs
 *
 * 输出（位于 软著提交材料/ 目录）：
 *   1. HTML 文件 —— 用浏览器打开后「打印 → 另存为 PDF」(A4)，页眉含软件名+版本号，页码右上角 1-60。
 *   2. TXT 文件 —— 每页 50 行 + 页眉行，供粘贴进 Word 排版。
 *
 * 修改下方 SOFTWARE_NAME / VERSION 后重新运行即可（需与申请表完全一致）。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ====== 与申请表一致的软件信息 ======
const SOFTWARE_NAME = '肠道花园儿童肠道健康科普软件';
const VERSION = 'V1.0';
const HEADER = `${SOFTWARE_NAME} ${VERSION}`;

// ====== 每页行数 / 页数（每页不少于 50 行） ======
const LINES_PER_PAGE = 50;
const PAGES_PER_SIDE = 30; // 前、后各 30 页
const TOTAL_PAGES = PAGES_PER_SIDE * 2;

// ====== 源程序目录（只收手写源码，排除 node_modules/dist/构建产物） ======
const SOURCE_DIRS = [
  'web/src',
  'server/src',
];
const EXTENSIONS = new Set(['.ts', '.tsx']);

// ====== 排除规则 ======
const EXCLUDE_PATTERNS = [
  /\.test\./, /\.spec\./, /__tests__/, /(^|\/)\..*/, // 隐藏文件/目录
];

function collectFiles(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (EXCLUDE_PATTERNS.some((p) => p.test(entry.name))) continue;
    if (entry.isDirectory()) {
      collectFiles(full, out);
    } else if (entry.isFile() && EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      out.push(full);
    }
  }
  return out;
}

// 按目录 + 路径排序，保证顺序稳定、可复现；web 前端在前，server 后端在后
function sortFiles(files) {
  const norm = (p) => relative(ROOT, p).replace(/\\/g, '/');
  const idx = (p) => (p.startsWith('web/src') ? 0 : p.startsWith('server/src') ? 1 : 2);
  return files.sort((a, b) => {
    const ra = norm(a).toLowerCase();
    const rb = norm(b).toLowerCase();
    const ia = idx(ra);
    const ib = idx(rb);
    if (ia !== ib) return ia - ib;
    return ra < rb ? -1 : ra > rb ? 1 : 0;
  });
}

function readLines(file) {
  let text = readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // 去 BOM
  const lines = text.split(/\r?\n/);
  if (lines.length && lines[lines.length - 1] === '') lines.pop(); // 去掉末尾空行
  return lines;
}

// ---- 收集并按固定顺序拼成连续的行数组 ----
let files = [];
for (const d of SOURCE_DIRS) {
  files = files.concat(collectFiles(join(ROOT, d)));
}
files = sortFiles(files);

const allLines = [];
const fileStats = [];
for (const f of files) {
  const lines = readLines(f);
  fileStats.push({ rel: relative(ROOT, f), lines: lines.length });
  allLines.push(...lines);
}

const total = allLines.length;
console.log(`源文件数: ${files.length}`);
console.log(`源程序总行数: ${total}`);
for (const s of fileStats) console.log(`  ${s.lines}\t${s.rel}`);
if (total <= 0) throw new Error('没有读到任何源码行');

// 超长行统计（供调整字号参考）
const longLines = allLines.filter((l) => l.length > 82).length;
const maxLen = allLines.reduce((m, l) => Math.max(m, l.length), 0);
console.log(`\n最大单行长度: ${maxLen}`);
console.log(`超过 82 字符的行数: ${longLines}（约 ${((longLines / total) * 100).toFixed(1)}%）`);

if (total < TOTAL_PAGES * LINES_PER_PAGE) {
  console.warn(
    `\n警告：总行数 ${total} 不足 60 页×50 行（${TOTAL_PAGES * LINES_PER_PAGE}），按规则应全部提交，文档将按实际行数生成 ${Math.ceil(total / LINES_PER_PAGE)} 页。`
  );
}

// ---- 前 30 页取开头 1500 行，后 30 页取末尾 1500 行 ----
const perSide = PAGES_PER_SIDE * LINES_PER_PAGE; // 1500
const front = allLines.slice(0, perSide);
const back = total >= perSide ? allLines.slice(total - perSide) : [];
const used = front.concat(back);
const pageCount = Math.ceil(used.length / LINES_PER_PAGE);

function pageLines(p) {
  return used.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
}

// ---- 估算打印时每页的实际物理行数（按折行后的行高占用） ----
// A4 宽 595pt，高 842pt；左边距 3.4cm(96pt) 作装订线，其余边距固定。
const PAGE_W_PT = 595.28;
const PAGE_H_PT = 841.89;
const MARGIN_L_PT = 96.4; // 3.4cm
const MARGIN_R_PT = 51.0; // 1.8cm
const MARGIN_T_PT = 73.7; // 2.6cm
const MARGIN_B_PT = 62.4; // 2.2cm
const PRINT_W_PT = PAGE_W_PT - MARGIN_L_PT - MARGIN_R_PT; // ≈448
const HEADER_H_PT = 26; // 页眉行 + 下边框 + 间距
const CODE_H_PT = PAGE_H_PT - MARGIN_T_PT - MARGIN_B_PT - HEADER_H_PT;

const isCJK = (c) => {
  const cp = c.codePointAt(0);
  return (
    cp >= 0x1100 ||
    (cp >= 0x2e80 && cp <= 0x9fff) ||
    (cp >= 0xac00 && cp <= 0xd7ff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xffef)
  );
};
const lineWidthEm = (l) => {
  let w = 0;
  for (const ch of l) w += isCJK(ch) ? 1.0 : 0.6;
  return w;
};

function estimatePagePhysicalLines(lines, fontPt) {
  const emPerLine = PRINT_W_PT / fontPt; // 一行能容纳多少 em
  let total = 0;
  for (const l of lines) {
    const w = lineWidthEm(l);
    total += Math.max(1, Math.ceil(w / emPerLine));
  }
  return total;
}

// 选取最大可行字号（6pt ~ 11pt，0.5pt 步长），保证最拥挤的一页也能放下一张 A4
function chooseFontSize() {
  const perPage = [];
  for (let p = 0; p < pageCount; p++) perPage.push(estimatePagePhysicalLines(pageLines(p), 9));
  let best = 9;
  for (let f = 11; f >= 6; f -= 0.5) {
    let worst = 0;
    for (let p = 0; p < pageCount; p++) {
      const phys = estimatePagePhysicalLines(pageLines(p), f);
      if (phys > worst) worst = phys;
    }
    if (worst * f * 1.14 <= CODE_H_PT) {
      best = f;
      break;
    }
  }
  let worstPhys = 0;
  let worstPage = -1;
  for (let p = 0; p < pageCount; p++) {
    const phys = estimatePagePhysicalLines(pageLines(p), best);
    if (phys > worstPhys) {
      worstPhys = phys;
      worstPage = p + 1;
    }
  }
  console.log(
    `自动选字号: ${best}pt（最拥挤的第 ${worstPage} 页折行后约 ${worstPhys} 行，A4 可容纳 ${Math.floor(CODE_H_PT / (best * 1.14))} 行）`
  );
  return best;
}
const CODE_FONT_PT = chooseFontSize();

// ---- HTML 转义 ----
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- 组装 HTML（打印到 PDF 用）----
const blocks = [];
for (let p = 0; p < pageCount; p++) {
  const lines = pageLines(p);
  const last = p === pageCount - 1;
  const code = esc(lines.join('\n'));
  blocks.push(`<section class="page${last ? ' last' : ''}">
  <header class="pg-header"><span>${esc(HEADER)}</span><span class="pg-num">${p + 1}</span></header>
  <pre class="pg-code">${code}</pre>
</section>`);
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${esc(HEADER)} 源程序（前/后各30页）</title>
<style>
  @page {
    size: A4 portrait;
    margin: 2.6cm 1.8cm 2.2cm 3.4cm; /* 左侧大边距作装订线 */
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page { page-break-after: always; break-after: page; }
  .page.last { page-break-after: auto; break-after: auto; }
  .pg-header {
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: 'SimSun', '宋体', 'Noto Sans CJK SC', serif;
    font-size: 10.5pt; line-height: 1; padding-bottom: 2mm;
    border-bottom: 0.6pt solid #000; margin-bottom: 3mm;
  }
  .pg-header .pg-num { font-family: 'Courier New', monospace; }
  .pg-code {
    margin: 0; white-space: pre-wrap; word-break: break-all;
    font-family: 'Courier New', Consolas, 'Noto Sans Mono CJK SC', monospace;
    font-size: ${CODE_FONT_PT}pt; line-height: 1.14; tab-size: 4;
  }
  @media print { .page { box-shadow: none; } }
</style>
</head>
<body>
${blocks.join('\n')}
</body>
</html>`;

// ---- 组装 TXT（每页 = 页眉行 + 50 行代码，页与页之间用换页符分隔）----
const txtPages = [];
for (let p = 0; p < pageCount; p++) {
  const lines = pageLines(p);
  txtPages.push(`第 ${p + 1} 页　${HEADER}` + '\n' + lines.join('\n'));
}
const txt = txtPages.join('\n\f\n');

// ---- 写出 ----
const outDir = join(ROOT, '软著提交材料');
mkdirSync(outDir, { recursive: true });
const base = `肠道花园_源程序_${VERSION}_${pageCount}页`;
const htmlPath = join(outDir, `${base}.html`);
const txtPath = join(outDir, `${base}.txt`);
writeFileSync(htmlPath, html, 'utf8');
writeFileSync(txtPath, txt, 'utf8');

console.log(`\n生成成功：`);
console.log(`  HTML（打印成 PDF 用）: ${relative(ROOT, htmlPath)}`);
console.log(`  TXT（Word 排版备用）  : ${relative(ROOT, txtPath)}`);
console.log(`页数: ${pageCount}（前 ${Math.min(PAGES_PER_SIDE, pageCount / 2)} 页 + 后 ${Math.max(0, pageCount - PAGES_PER_SIDE)} 页）`);
console.log(`每页行数: ${LINES_PER_PAGE}，页眉: ${HEADER}`);
