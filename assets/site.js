/*
 * 依 data/notes.js 產生：
 *   首頁 (body[data-page="home"])：標籤篩選與筆記目錄
 *   筆記頁 (body[data-page="note"])：日期、閱讀時間、標籤、上下篇導覽
 * body[data-root] 是回到網站根目錄的相對路徑（首頁 "."，筆記頁 ".."）。
 */
(function () {
  "use strict";

  const notes = window.NOTES || [];
  const site = window.SITE || { tags: [] };
  const root = document.body.dataset.root || ".";

  /** 筆記頁的網址。 */
  function noteUrl(note) {
    return `${root}/notes/${note.id}-${note.slug}.html`;
  }

  /** 建立元素；text 一律以 textContent 寫入，避免資料被當成 HTML。 */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** 日期、閱讀時間與標籤，首頁與筆記頁共用。 */
  function metaLine(note) {
    const line = el("p", "meta");
    const time = el("time", null, note.date);
    time.dateTime = note.date;
    line.append(time, el("span", null, `閱讀約 ${note.minutes} 分鐘`));
    note.tags.forEach((tag) => line.append(el("span", "tag", tag)));
    return line;
  }

  function renderHome() {
    const list = document.getElementById("note-list");
    const filter = document.getElementById("tag-filter");
    const empty = document.getElementById("note-empty");
    let active = null; // null 代表顯示全部

    function drawList() {
      const shown = notes.filter((n) => !active || n.tags.includes(active));
      list.replaceChildren(
        ...shown.map((note) => {
          const item = el("li", "note-row");
          const link = el("a", null, note.title);
          link.href = noteUrl(note);
          const title = el("h3");
          title.append(link);
          item.append(
            el("span", "note-num", note.id),
            title,
            el("p", "note-summary", note.summary),
            metaLine(note)
          );
          return item;
        })
      );
      empty.hidden = shown.length > 0;
    }

    function drawFilter() {
      const choices = [null, ...site.tags];
      filter.replaceChildren(
        ...choices.map((tag) => {
          const button = el("button", "tab", tag || "全部");
          button.type = "button";
          button.setAttribute("aria-pressed", String(tag === active));
          button.addEventListener("click", () => {
            active = tag;
            drawFilter();
            drawList();
          });
          return button;
        })
      );
    }

    drawFilter();
    drawList();
  }

  function renderNote() {
    const id = document.body.dataset.noteId;
    const index = notes.findIndex((n) => n.id === id);
    const metaSlot = document.getElementById("note-meta");
    const navSlot = document.getElementById("note-nav");

    if (index === -1) {
      metaSlot.append(
        el("p", "meta", "這篇筆記還沒登記在 data/notes.js，請依 AGENTS.md 第 7 節補上。")
      );
      return;
    }

    const note = notes[index];
    metaSlot.append(el("span", "note-num", note.id), metaLine(note));

    [
      ["上一篇", "nav-prev", notes[index - 1]],
      ["下一篇", "nav-next", notes[index + 1]],
    ].forEach(([label, side, target]) => {
      if (!target) return;
      const link = el("a", `nav-link ${side}`);
      link.href = noteUrl(target);
      link.append(el("span", "nav-label", label), el("span", "nav-title", target.title));
      navSlot.append(link);
    });
  }

  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "note") renderNote();
})();
