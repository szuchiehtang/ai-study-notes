# AI 學習筆記

AI 課程的學習筆記網站。一個主題一頁，每頁都用同一種格式：重點、概念、範例、誤區、自我檢核、延伸閱讀。

這個專案的重點是 [`AGENTS.md`](AGENTS.md)：它把網站的目的、風格、結構、命名與新增流程寫成規則，
讓 AI 代理之後可以照同一套方式繼續新增筆記。`CLAUDE.md` 只有一行 `@AGENTS.md`，兩種工具讀到的是同一份規則。

## 目前內容

| 編號 | 筆記 |
|---|---|
| 01 | 提示工程基礎：把話說清楚 |
| 02 | Vibe Coding：用對話把網頁做出來 |
| 03 | AGENTS.md 與 CLAUDE.md：把專案規則寫給 AI |

## 專案結構

```
index.html                   首頁目錄（由 data/notes.js 產生）
notes/NN-slug.html           筆記頁
templates/note-template.html 新筆記的模板
data/notes.js                筆記清單與標籤，唯一的資料來源
assets/style.css, site.js    樣式與頁面腳本
tools/check.mjs              規則檢查腳本
AGENTS.md, CLAUDE.md         給 AI 的協作規則
```

## 新增一篇筆記

在專案資料夾中對 AI 代理說：

```
請依 AGENTS.md 新增一篇筆記，主題是（你的主題）。
```

AI 會複製模板、填入六個區塊、在 `data/notes.js` 登記，並執行檢查。
首頁目錄、標籤篩選與上下篇導覽會自動更新。

## 本機預覽與檢查

- 預覽：用瀏覽器直接開啟 `index.html`，不需要伺服器。
- 檢查：`node tools/check.mjs`（需要 Node.js 18 以上，不需安裝套件）。

## 發布

網站是純靜態檔案。在 GitHub 的 Settings → Pages 選擇 `main` 分支的根目錄即可發布。
