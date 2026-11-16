#!/usr/bin/env node
/*
 * 檢查專案是否符合 AGENTS.md 的規則。用法：node tools/check.mjs
 * 不需要安裝任何套件。有任何一項不符就列出並以狀態碼 1 結束。
 *
 * 檢查範圍：
 *   1. data/notes.js 的欄位（AGENTS.md 第 6 節）
 *   2. 每篇筆記頁的結構與內容數量（第 5 節）
 *   3. 筆記頁與 data/notes.js 是否一致、有沒有漏登記的檔案
 *   4. 站內相對連結是否指向存在的檔案
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SECTION_IDS = ["key-points", "concepts", "example", "pitfalls", "self-check", "further-reading"];
const TITLE_SUFFIX = "｜AI 學習筆記";
const MAX_SUMMARY_CHARS = 60;
const MAX_SITE_TAGS = 6;

const errors = [];
const fail = (where, message) => errors.push(`${where}：${message}`);

/** 在沙盒中執行 data/notes.js，取回它掛在 window 上的資料。 */
function loadData() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(ROOT, "data/notes.js"), "utf8"), sandbox);
  return sandbox.window;
}

/** 去掉標籤並還原基本字元實體，取得純文字。 */
function text(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

const count = (html, pattern) => (html.match(pattern) || []).length;
const firstGroup = (html, pattern) => (html.match(pattern) || [])[1];

function checkData(site, notes) {
  const where = "data/notes.js";
  if (!Array.isArray(site?.tags) || site.tags.length === 0) fail(where, "window.SITE.tags 必須是非空陣列");
  else if (site.tags.length > MAX_SITE_TAGS) fail(where, `全站標籤不可超過 ${MAX_SITE_TAGS} 個`);
  if (!Array.isArray(notes)) {
    fail(where, "window.NOTES 必須是陣列");
    return;
  }

  let previousId = "";
  for (const note of notes) {
    const tag = `${where} [${note.id}]`;
    if (!/^\d{2}$/.test(note.id ?? "")) fail(tag, "id 必須是兩位數字字串");
    else if (note.id <= previousId) fail(tag, "id 必須遞增且不可重複");
    previousId = note.id ?? previousId;

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(note.slug ?? "")) fail(tag, "slug 必須是英文小寫加連字號");
    if (!note.title?.trim()) fail(tag, "缺少 title");
    if (!note.summary?.trim()) fail(tag, "缺少 summary");
    else if ([...note.summary].length > MAX_SUMMARY_CHARS) fail(tag, `summary 超過 ${MAX_SUMMARY_CHARS} 字`);

    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(note.date ?? "") &&
      new Date(`${note.date}T00:00:00Z`).toISOString().startsWith(note.date);
    if (!validDate) fail(tag, "date 必須是存在的日期，格式 YYYY-MM-DD");
    if (!Number.isInteger(note.minutes) || note.minutes <= 0) fail(tag, "minutes 必須是正整數");

    if (!Array.isArray(note.tags) || note.tags.length < 1 || note.tags.length > 2) fail(tag, "tags 必須有 1 到 2 個");
    else note.tags.filter((t) => !site.tags?.includes(t)).forEach((t) => fail(tag, `標籤「${t}」不在 window.SITE.tags`));
  }
}

function checkNotePage(note) {
  const file = `notes/${note.id}-${note.slug}.html`;
  if (!existsSync(join(ROOT, file))) {
    fail(file, "檔案不存在");
    return;
  }
  const html = readFileSync(join(ROOT, file), "utf8");

  // 與 data/notes.js 一致
  if (firstGroup(html, /<body[^>]*data-note-id="([^"]*)"/) !== note.id) fail(file, "data-note-id 與 id 不符");
  if (text(firstGroup(html, /<title>([\s\S]*?)<\/title>/) ?? "") !== note.title + TITLE_SUFFIX)
    fail(file, `<title> 必須是「${note.title}${TITLE_SUFFIX}」`);
  if (text(firstGroup(html, /<h1>([\s\S]*?)<\/h1>/) ?? "") !== note.title) fail(file, "h1 與 title 不符");
  if (text(firstGroup(html, /<p class="summary">([\s\S]*?)<\/p>/) ?? "") !== note.summary)
    fail(file, "p.summary 與 summary 不符");
  if (text(firstGroup(html, /<meta name="description" content="([^"]*)"/) ?? "") !== note.summary)
    fail(file, "meta description 與 summary 不符");

  // 禁止事項
  if (html.includes("【待填")) fail(file, "還有未填寫的「【待填…】」");
  if (/\sstyle="/.test(html) || /<style[\s>]/.test(html)) fail(file, "不可使用行內樣式或 <style>");
  if (/<script(?![^>]*\ssrc=)[^>]*>/.test(html)) fail(file, "不可加入行內 <script>");
  for (const id of ["note-meta", "note-nav"]) if (!html.includes(`id="${id}"`)) fail(file, `缺少 #${id}`);

  // 六個區塊的順序與數量
  const sections = new Map();
  for (const [, id, body] of html.matchAll(/<section id="([^"]+)">([\s\S]*?)<\/section>/g)) sections.set(id, body);
  if ([...sections.keys()].join() !== SECTION_IDS.join()) {
    fail(file, `區塊必須依序為 ${SECTION_IDS.join("、")}`);
    return;
  }
  const between = (label, n, min, max) => {
    if (n < min || n > max) fail(file, `${label}應為 ${min === max ? min : `${min} 到 ${max}`} 個，目前 ${n} 個`);
  };

  const keyPoints = sections.get("key-points").match(/<li>[\s\S]*?<\/li>/g) || [];
  between("本頁重點", keyPoints.length, 3, 5);
  if (keyPoints.some((li) => count(li, /<mark>/g) > 1)) fail(file, "本頁重點每點最多標一處 <mark>");
  if (SECTION_IDS.slice(1).some((id) => sections.get(id).includes("<mark>"))) fail(file, "<mark> 只能用在本頁重點");

  between("核心概念的 h3 小節", count(sections.get("concepts"), /<h3>/g), 2, 4);
  between("實作範例的 figure.sample", count(sections.get("example"), /<figure class="sample">/g), 1, Infinity);

  const pitfalls = sections.get("pitfalls").match(/<li>[\s\S]*?<\/li>/g) || [];
  between("常見誤區", pitfalls.length, 1, Infinity);
  if (pitfalls.some((li) => !/<del>[\s\S]+<\/del>\s*<p>/.test(li))) fail(file, "常見誤區每點必須是 <del> 加一段 <p>");

  between("自我檢核題", count(sections.get("self-check"), /<details class="check">/g), 3, 3);
  const refs = sections.get("further-reading").match(/<li>[\s\S]*?<\/li>/g) || [];
  between("延伸閱讀", refs.length, 2, 5);
  if (refs.some((li) => !/<a href="https?:\/\//.test(li))) fail(file, "延伸閱讀每筆都要有連結");
}

/** 相對連結必須指向存在的檔案。 */
function checkLinks(file) {
  const html = readFileSync(join(ROOT, file), "utf8");
  for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|#)/.test(url)) continue;
    const target = resolve(dirname(join(ROOT, file)), url.split(/[?#]/)[0]);
    if (!existsSync(target)) fail(file, `連結「${url}」指向不存在的檔案`);
  }
}

const { SITE: site, NOTES: notes } = loadData();
checkData(site, notes);

if (Array.isArray(notes)) {
  notes.forEach(checkNotePage);

  const registered = new Set(notes.map((n) => `${n.id}-${n.slug}.html`));
  const noteFiles = readdirSync(join(ROOT, "notes")).filter((name) => name.endsWith(".html"));
  noteFiles.filter((name) => !registered.has(name)).forEach((name) => fail(`notes/${name}`, "尚未登記在 data/notes.js"));

  ["index.html", ...noteFiles.map((name) => `notes/${name}`)].forEach(checkLinks);
}

if (errors.length > 0) {
  console.error(`檢查未通過，共 ${errors.length} 項：`);
  errors.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}
console.log(`檢查通過：${notes.length} 篇筆記都符合 AGENTS.md 的規則。`);
