# AGENTS.md：AI 學習筆記網站的協作規則

這份文件寫給在這個專案裡工作的 AI 代理 (AI agent)。動手之前請先讀完；
`CLAUDE.md` 只是用 `@AGENTS.md` 匯入本檔，規則只維護這一份。

## 1. 專案目的

這是一個純靜態的「AI 學習筆記」網站，發布在 GitHub Pages。

- 一個主題一頁筆記，每頁都用同一種結構，方便日後複習與比對。
- 讀者是作者本人、同學與授課老師：要能在首頁很快找到筆記，點進去能讀懂。
- 專案的重點不是單一頁面，而是「之後能用同一套方式很快再加一頁」。

## 2. 技術原則

- 純 HTML、CSS、JavaScript，沒有框架、沒有建置步驟 (build step)、沒有 npm 套件。
- 用瀏覽器直接開啟 `index.html` 就要能正常瀏覽（所以資料用 `<script>` 載入，不用 `fetch`）。
- 唯一允許的外部資源是 Google Fonts 的字型。不要加入 CDN 函式庫、追蹤碼或圖片外連。
- 所有連結用相對路徑，網站才能放在 GitHub Pages 的子路徑下。

## 3. 專案結構

```
index.html                  首頁：筆記目錄，內容由 data/notes.js 產生
notes/NN-slug.html          筆記頁，一篇一檔
templates/note-template.html 新筆記的起點，複製它，不要修改它
data/notes.js               筆記清單與標籤清單，唯一的資料來源
assets/style.css            全站樣式與設計變數 (design tokens)
assets/site.js              產生首頁目錄、筆記頁的中繼資料與上下篇導覽
tools/check.mjs             檢查腳本，每次修改後都要執行
AGENTS.md / CLAUDE.md       本規則
README.md                   給人看的專案說明
```

資料夾名稱不要以底線 `_` 或句點 `.` 開頭（GitHub Pages 預設會略過）。

## 4. 視覺風格

整體是「學生的筆記本」：白紙、左側一條紅色邊線、藍筆寫標題、紅筆改錯、螢光筆畫重點。

- 顏色、字型、間距只能用 `assets/style.css` 開頭 `:root` 裡的變數，不要寫新的色碼。
- 標題用楷體 (`--font-hand`)，內文用黑體 (`--font-body`)，程式碼與提示範例用等寬字。
- 每種筆各有用途，不可混用：
  - 藍筆 `--pen-blue`：標題、連結
  - 紅筆 `--pen-red`：只用在「常見誤區」與左側邊線
  - 螢光筆 `<mark>`：只用在「本頁重點」，每點最多標一處
- 不要在 HTML 寫 `style="..."`，不要在筆記頁加 `<style>` 或 `<script>` 區塊。
- 需要新的版面元件時，先確認現有 class 做不到，再加到 `assets/style.css`，並在第 5 節補上說明。
- 不做深色模式、不加動畫。

## 5. 筆記頁的固定格式

每篇筆記都由 `templates/note-template.html` 複製而來，六個區塊的順序與 `id` 不可更動：

| 順序 | `id` | 標題 | 內容規定 |
|---|---|---|---|
| 1 | `key-points` | 本頁重點 | `ul.key-points`，3 到 5 點，每點一句話 |
| 2 | `concepts` | 核心概念 | 2 到 4 個 `h3` 小節；比較用 `table.compare`，步驟用 `ol.steps`，條列用 `ul.list` |
| 3 | `example` | 實作範例 | 至少一個 `figure.sample`（`figcaption` 加 `pre`） |
| 4 | `pitfalls` | 常見誤區 | `ul.pitfalls`，每點是 `<del>錯誤想法</del>` 加一段修正 |
| 5 | `self-check` | 自我檢核 | 3 題 `details.check`，`summary` 是題目，內文是答案 |
| 6 | `further-reading` | 延伸閱讀 | `ol.refs`，2 到 5 筆，每筆有連結與一句說明 |

頁首另有 `h1`（標題）與 `p.summary`（一句話摘要）。
日期、閱讀時間、標籤、上下篇導覽由 `assets/site.js` 依 `data/notes.js` 自動產生，不要手寫。

## 6. 命名與放置

- 筆記檔名：`notes/NN-slug.html`。`NN` 是兩位數流水號（接續目前最大號），`slug` 是英文小寫加連字號，例如 `04-rag-basics.html`。
- `data/notes.js` 的每筆資料：

  | 欄位 | 規定 |
  |---|---|
  | `id` | 與檔名的 `NN` 相同的字串 |
  | `slug` | 與檔名的 `slug` 相同 |
  | `title` | 與筆記頁 `h1` 完全相同 |
  | `summary` | 與筆記頁 `p.summary` 相同，60 字以內 |
  | `date` | 筆記建立日期，`YYYY-MM-DD` |
  | `minutes` | 預估閱讀分鐘數，正整數 |
  | `tags` | 1 到 2 個，必須出自 `window.SITE.tags` |

- 需要新標籤時，先加進 `window.SITE.tags`；全站標籤不超過 6 個。
- 圖片放 `assets/img/`，檔名以筆記編號開頭，例如 `04-pipeline.svg`，並寫 `alt`。

## 7. 新增一篇筆記的流程

1. 讀 `data/notes.js`，確認下一個流水號與可用標籤。
2. 複製 `templates/note-template.html` 為 `notes/NN-slug.html`。
3. 把所有 `【待填…】` 換成內容，並把 `<body>` 的 `data-note-id` 改成 `NN`。
4. 在 `data/notes.js` 的 `window.NOTES` 最後加一筆資料。
5. 執行 `node tools/check.mjs`，修到全部通過。
6. 回報新增了哪些檔案，以及檢查結果。

首頁目錄、標籤篩選、上下篇導覽都會自動更新，不需要修改 `index.html` 與其他筆記頁。

## 8. 寫作規則

- 使用繁體中文；專有名詞第一次出現時在括號內附英文，例如「少樣本提示 (few-shot prompting)」。
- 先講結論再解釋。一個段落只講一件事，段落不超過 5 行。
- 內容要查證。年份、人名、數據、引文都必須有出處，並列在「延伸閱讀」。
  查不到可靠來源就不要寫，並在回報中說明，不可自行編造。
- 來源優先順序：論文與官方文件，其次是作者本人的文章，最後才是二手整理。
- 範例要能直接照做：提示範例寫出完整提示，程式範例要能執行。
- 不直接複製來源的段落，用自己的話重寫；引文不超過一句。

## 9. 修改既有內容的規則

- 只改被要求的部分，不順手重寫其他筆記或調整全站樣式。
- 改筆記標題或摘要時，`data/notes.js` 的對應欄位要一起改。
- 已發布筆記的編號與檔名不可更動（連結會失效）；要下架就同時刪除檔案與 `data/notes.js` 的資料。
- 改 `assets/style.css` 或 `assets/site.js` 會影響所有頁面，改完要逐頁確認。

## 10. 完成前的檢查

每次修改後執行：

```
node tools/check.mjs
```

它會檢查檔名、資料欄位、六個區塊的順序、標題是否一致、是否殘留 `【待填`、站內連結是否存在。
沒有全部通過就不算完成。腳本檢查不到的事（內容正確、讀起來通順）仍要自己確認。

## 11. 不要做的事

- 不要引入框架、建置工具或套件管理。
- 不要修改 `templates/note-template.html` 的區塊結構，除非同時更新本檔第 5 節、`tools/check.mjs` 與所有既有筆記。
- 不要為了讓檢查通過而修改 `tools/check.mjs`。
- 不要在沒被要求時執行 `git push` 或更動 GitHub Pages 設定。
