/*
 * 全站唯一的資料來源。首頁目錄、標籤篩選、筆記頁的中繼資料與上下篇導覽都由這裡產生。
 * 欄位規定見 AGENTS.md 第 6 節。新增筆記時，在 NOTES 最後加一筆。
 */
window.SITE = {
  name: "AI 學習筆記",
  tags: ["提示工程", "AI 輔助開發", "規則與脈絡"],
};

window.NOTES = [
  {
    id: "01",
    slug: "prompt-basics",
    title: "提示工程基礎：把話說清楚",
    summary: "好的提示包含任務、脈絡、範例與輸出格式，寫完還要依結果修改。",
    date: "2026-11-16",
    minutes: 7,
    tags: ["提示工程"],
  },
  {
    id: "02",
    slug: "vibe-coding",
    title: "Vibe Coding：用對話把網頁做出來",
    summary: "只描述想要的結果、不讀程式碼的開發方式；適合原型，不適合長期維護。",
    date: "2026-11-16",
    minutes: 6,
    tags: ["AI 輔助開發"],
  },
  {
    id: "03",
    slug: "agents-md",
    title: "AGENTS.md 與 CLAUDE.md：把專案規則寫給 AI",
    summary: "規則檔讓 AI 每次開工都先知道專案的目的、結構與做法，新頁面才會長得一致。",
    date: "2026-11-16",
    minutes: 8,
    tags: ["規則與脈絡", "AI 輔助開發"],
  },
];
