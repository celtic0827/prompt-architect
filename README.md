# PromptArchitect

<div align="center">
<img width="100%" alt="PromptArchitect Interface" src="https://upload.cc/i1/2025/11/24/VKHtz3.jpg" />

<br/>

<!-- Live Demo Button -->
[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo_線上試用-Click_Here-10b981?style=for-the-badge&logo=google-chrome&logoColor=white)](https://prompt-architect-xi.vercel.app/)

<br/>
<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[**English**](#-english-introduction) | [**繁體中文**](#-繁體中文介紹)

</div>

---

## 🚀 English Introduction

**PromptArchitect** is a professional-grade, modular prompt engineering tool designed for AI artists (Stable Diffusion, Midjourney, Flux). It replaces the chaos of text editors with a structured, visual **Drag-and-Drop** workflow.

Manage your prompt library with tags, assemble complex prompts like building blocks, and use smart automation to generate new ideas instantly.

### ✨ Key Features

*   **🧩 Visual Block Builder:** Construct prompts intuitively by dragging blocks from your library to the canvas. Sort, reorder, and tweak with ease.
*   **✏️ In-Place Editing:** Directly edit block content in the Builder or Library. Tweak weights (e.g., `(keyword:1.2)`) on the fly without altering your original library.
*   **📂 Smart Library Management:** Organize thousands of prompt fragments using a **Tag System** (e.g., Subject, Style, Lighting). Supports **Bulk Management** mode for efficient cleanup.
*   **🪄 Auto-Generate (Magic Wand):** Stuck on ideas? The "Auto" feature randomly selects blocks based on your customized Tag Order to create unique, coherent prompts instantly.
*   **🌐 Translation Assistant:** Built-in bilingual translation (Powered by MyMemory). Verify prompt meanings (En → Zh) or convert your ideas into English prompts (Zh → En) directly within the app.
*   **💾 Local Storage Persistence:** Your data is automatically saved to your browser. Close the tab or refresh without losing your work. No account required.
*   **🏷️ Tag-Based Sorting:** Define a logical order for your tags (e.g., Subject → Style → Camera) and sort your final prompt with one click to ensure optimal AI interpretation.
*   **💾 Data Portability:** Full support for **CSV Import/Export**. Backup your library or share curated prompt packs with the community.
*   **🌐 Bilingual Interface:** Native support for **English** and **Traditional Chinese** (繁體中文), switchable instantly within the UI.

### ⚡ One-Click Deployment

You can deploy your own instance of PromptArchitect for free using these services:

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
&nbsp;&nbsp;&nbsp;&nbsp;
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

</div>

---

## 🚀 繁體中文介紹

**PromptArchitect** 是一款專為 AI 繪圖創作者（Stable Diffusion, Midjourney, Flux 使用者）打造的專業模組化提示詞構建工具。它將混亂的純文字編輯轉化為結構化、可視化的**拖曳式（Drag-and-Drop）**工作流。

透過標籤管理您的提示詞庫，像堆積木一樣組裝複雜的 Prompt，並利用智慧自動化功能瞬間激發創作靈感。

### ✨ 核心功能

*   **🧩 可視化積木構建:** 從左側庫拖曳區塊至右側畫布，直觀地組裝 Prompt。支援自由排序、刪除與調整。
*   **✏️ 原地即時編輯:** 直接在構建區或圖庫中修改內容。快速調整權重（如 `(keyword:1.2)`），無需重建區塊。
*   **📂 智慧庫管理:** 透過**標籤系統 (Tag)** 分類管理成千上萬的提示詞碎片（如：主體、畫風、光影）。內建**批量管理模式**，選取與刪除更高效。
*   **🪄 自動組裝 (魔法棒):** 缺乏靈感？點擊「自動 (Auto)」按鈕，系統將依照您設定的標籤順序，隨機抽取區塊組合成全新的 Prompt。
*   **🌐 翻譯助手:** 內建雙語翻譯功能（MyMemory API）。可驗證 Prompt 語意 (英→中)，或將您的中文靈感轉為英文 Prompt (中→英)。
*   **💾 自動存檔 (Local Storage):** 資料自動儲存在瀏覽器中。關閉分頁或重新整理，資料都不會消失。無需註冊帳號。
*   **🏷️ 標籤邏輯排序:** 自定義標籤的權重順序（例如：主體 → 畫風 → 鏡頭），一鍵將構建區的提示詞依此邏輯重新排列，優化 AI 繪圖權重。
*   **💾 數據導入導出:** 完整支援 **CSV 格式導入與導出**。輕鬆備份您的資料庫，或與社群分享您的專屬提示詞包。
*   **🌐 雙語介面:** 內建**英文**與**繁體中文**介面，點擊頂部按鈕即可即時切換。

### 🛠️ Prerequisites (環境需求)

To run this project locally, you need:
*   **Node.js** (v18 or higher recommended)
*   **npm** (comes with Node.js)

### 📦 Installation & Setup (安裝教學)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/prompt-architect.git
    cd prompt-architect
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open your browser at `http://localhost:5173`.

### 🚢 Deployment (部署)

You can easily deploy this project to Vercel or Netlify for free.

**Using Vercel CLI:**
```bash
npm install -g vercel
vercel
```

**Manual Deployment:**
Simply push your code to GitHub, then log in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and import your repository. The build settings are pre-configured (`npm run build`).

## 📄 License

This project is open source and available under the [MIT License](LICENSE).