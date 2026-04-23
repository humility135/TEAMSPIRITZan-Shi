# TEAMSPIRIT — Product Requirements Document v2

> v2 改動摘要：重整 Token 經濟、補完搶位 state machine、Stripe Connect 落地細節、加入 Friendly Match / Share Card 等成長引擎、收緊 MVP 範圍至 6 週可上線、補上 Success Metrics 與私隱條款。

---

## 0. 文件版本紀錄
| 版本 | 日期 | 主要改動 |
|------|------|---------|
| v1 | — | 初版，定義核心功能與 4 階段 Roadmap |
| v2 | 2026-04 | 收窄 MVP、補完邊緣案例、加入成長引擎、修正商業模型矛盾位 |

---

## 1. 競品分析與產品定位 (Positioning)

### 1.1 競品矩陣
| 競品 | 核心弱點 | TEAMSPIRIT 差異化 |
|------|---------|-------------------|
| **WhatsApp Group** | 訊息洗版、人手點名、無賽後數據 | 全自動化引擎：雙階段搶位 + 強制先付款後佔位 + 賽後數據 |
| **Joyso** | 偏向「跨隊約戰」，弱於單隊內部管理 | 內部向心力為主，但**保留約戰入口**（v2 新增 Friendly Match） |
| **Meetup** | 泛用、抽佣高、無足球專屬功能 | 深度在地化（康文署場地、天文台、PayMe / FPS） |
| **康文署 LCSD 系統** | 抽籤煩、要 PC 操作、不能管隊 | v2 Phase 4：場地抽籤協助 + 已 book 場登記 |

### 1.2 一句話定位
> 「為香港業餘足球隊而設嘅指揮中心 — 從報名到出糧，一個 App 解決。」

### 1.3 目標用戶優先序
1. **P0 球隊隊長 (Owner)** — 痛點最深，付費意願最高，產品設計圍繞佢
2. **P1 球隊管理員 (Admin)** — Owner 嘅副手，需要有限授權
3. **P2 球員 (Member)** — 主要 RSVP 同睇數據，付費少但決定 viral

---

## 2. 用戶角色與權限矩陣
*(維持 v1，新增「轉讓 Owner」與「刪除球隊」流程細節，見 §11)*

| 功能 / 角色 | Owner | Admin | Member | Guest |
|------------|:-----:|:-----:|:------:|:-----:|
| 查看公開資訊 | ✅ | ✅ | ✅ | ✅ |
| 報名 / 出席活動 | ✅ | ✅ | ✅ | ❌ |
| 查看個人數據 | ✅ | ✅ | ✅ | ❌ |
| 發起 / 取消活動 | ✅ | ✅ | ❌ | ❌ |
| 填寫賽後數據 | ✅ | ✅ | ❌ | ❌ |
| 審批成員加入 | ✅ | ✅ | ❌ | ❌ |
| 踢除一般成員 | ✅ | ✅ | ❌ | ❌ |
| 踢除 Admin | ✅ | ❌ | ❌ | ❌ |
| 設定 / 更改 Payout | ✅ | ❌ | ❌ | ❌ |
| 處理退款 | ✅ | ❌ | ❌ | ❌ |
| 轉讓 Owner 身份 | ✅ | ❌ | ❌ | ❌ |
| 刪除球隊 | ✅ | ❌ | ❌ | ❌ |
| **(v2)** Export 個人歷史數據 | ✅ | ✅ | ✅ | ❌ |
| **(v2)** Export 球隊財務報表 | ✅ | ❌ | ❌ | ❌ |

---

## 3. 商業模型 v2 — Token 經濟修正版

### 3.1 收費矩陣
| 計劃 | 價格 | 內容 | 適合 |
|------|------|------|------|
| **Free** | $0 | 永久 3 個槽位、僅免費活動、近 3 個月歷史 | 偶爾踢波 |
| **Tokens 入門** | $20 | 10 Tokens | 一次性試用 |
| **Tokens 超值** | $40 | 25 Tokens (送 5) | 多隊球員 |
| **Tokens 狂熱** | $60 | 40 Tokens (送 10) | 重度玩家 |
| **(v2 新增) Lite 月費** | **$28/月** | 5 隊上限、收費活動唔扣 Token、無雷達圖 | 中量級隊長 |
| **Pro 月費** | $78/月 | 20 隊上限、所有 Pro 功能、無水印 | 多隊領隊 |

> **新增 Lite 嘅理由**：v1 中 Free (3 隊) → Pro ($78) 個 gap 太闊，會逼走「踢 4–5 隊但唔想畀 $78」嗰班核心用戶。Lite 接住呢個 segment，預估可提升整體 ARPU 約 20%。

### 3.2 Token 消耗邏輯（修正）
| 動作 | 扣費 | 週期 |
|------|------|------|
| 加入球隊 | 1 Token | 每 30 日自動續扣 |
| 創立球隊 | 2 Tokens | 每 30 日自動續扣 |
| 舉辦收費活動 | 1 Token | **逐次扣** |

### 3.3 Token 永不過期 ≠ 槽位永不失效（v2 釐清）
- **Token 餘額永久有效**（已收嘅錢，產品保證唔到期）。
- **槽位** 喺扣款失敗 = 進入 30 日寬限期 → 之後自動釋放。
- **寬限期 UI**：球隊頂部紅 banner「7 日內未補 Token，球隊將被歸檔」+ 倒數。

### 3.4 扣款前提醒（v2 新增）
- T-7 日：Email + Push「下次扣 Token 時間：YYYY/MM/DD」
- T-1 日：Push「明日扣 1 Token，餘額 X」
- T+0：扣款成功 / 失敗通知
- **「自動補 Token」開關**：餘額 < 5 時自動 charge $20 套餐（Stripe saved card）

### 3.5 Token 經濟 Worked Example
> **典型 Owner**（管 1 隊、每月 4 場收費活動）
> - 創隊：2 Tokens / 30 日
> - 舉辦收費活動：4 Tokens / 月
> - **每月燒：6 Tokens ≈ $12**（以 $20/10 換算）
> - 結論：**$28 Lite 月費對佢更化算**（且解鎖無 Token 顧慮）

> **重度球員**（踢 4 隊、其中 2 隊收費）
> - 加入 4 隊：4 Tokens / 30 日
> - **每月燒：4 Tokens ≈ $8**
> - Token 模式仲化算，不必升 Pro

→ 透過呢條經濟線，引導**創隊用戶 → 月費**、**球員 → Token**。

---

## 4. 雙階段候補機制 v2 — 完整 State Machine

### 4.1 時區定義
- 所有「活動當天 00:00」一律以**活動所在地時區** (`event.venue.timezone`) 為準。預設 `Asia/Hong_Kong`。
- 跨境活動（深圳場）需 Owner 喺發起時揀返時區。

### 4.2 第一階段（活動日前）
- 觸發：有 `ATTEND` 改 `DECLINE`
- 系統按 `waitlist[0].joinedAt` 自動遞補
- 自動扣款（如付過費）→ **如失敗，跳下一位**，5 秒內 retry 一次

### 4.3 第二階段（搶位模式）— 釐清「先付款 vs 先 click」之爭
v2 採用 **「Click 鎖位 + 限時付款」** 兩段式，但**鎖位係排隊 (FIFO)**，唔係單一鎖死：

```
[Spot Released]
      │
      ▼
[Push 推送俾所有候補]
      │
      ▼
┌─────────────────────────────────────┐
│ Slot Reservation Queue (FIFO)       │
│  - 第 1 位 click = 進入 10 分鐘付款   │
│  - 第 2、3 位繼續排隊（顯示「你係第 N 位」）│
│  - 第 1 位 timeout / 失敗 → 第 2 位上位 │
│  - 第 1 位付款成功 → 釋放第 2-N 位回候補 │
└─────────────────────────────────────┘
```

### 4.4 邊緣案例處理（v2 補完）

| 情境 | 處理 |
|------|------|
| 第 1 位鎖位中、原本退出嗰個又改返 ATTEND | **拒絕 reverse**，必須走 join waitlist 流程，避免雙重佔位 |
| 鎖位 10 分鐘內，新嘅人退出（產生第 2 個位） | 第 2 個 spot 獨立行 §4.3 流程，並行進行 |
| Admin 手動加人 | **Admin 手動加唔需排隊**，直接 ATTEND，但必須**先扣 Admin 嘅 Token / 自付**，確保人頭數合法 |
| 球員手快 click 兩個位（兩個活動同時開搶） | 系統 lock by user_id，每 user 同一時刻只能持有一個 active reservation |
| Push 失敗（用戶關通知） | Fallback：Email + WhatsApp Click-to-Chat 連結（見 §9） |

### 4.5 鎖位倒數 UI
- 出席頁置頂顯示 `mm:ss` 倒數
- 最後 60 秒變紅 + 震動
- 超時自動釋放 + 顯示「下次手快啲」彩蛋動畫

---

## 5. 支付 / 退款流程 v2

### 5.1 支付方式優先序（修訂）
1. **PayMe for Business**（v2 提前到 Phase 2）— **港人主場**，採用率預期 > Stripe
2. **FPS 手動入數截圖** — 零門檻 fallback，新隊一定有
3. **Stripe Card / Apple Pay / Google Pay** — 跨境 / 高客單

> **v1 將 Stripe 放第一**係 SF / SV mindset。香港實況：PayMe 月活 280萬，Stripe Connect Onboarding 對普通人太煩（要 BR）→ 會死於 Phase 2。

### 5.2 Stripe Connect Onboarding Friction（v2 補上）
- **個人 Admin（無 BR）**：用 **Stripe Express** + 香港個人戶口（最低門檻：HKID + 銀行戶口）
- 系統需提供逐步 wizard + 中文說明
- **如 Onboarding 失敗 / 唔想搞**：自動降級至「FPS 手動模式」，唔阻塞用戶

### 5.3 平台抽成 — 釐清誰付
- **Stripe / PayMe**：平台抽 **5%**，由**球員付**（價格上加 5%，例如報名費 $50 → 球員實付 $52.5）
- **FPS 手動**：平台**唔抽**（無金流），但 Admin 仍需 1 Token / 活動
- 真實 unit economics 範例：

| 場景 | 球員付 | 抽成 | Stripe 手續費 | Admin 實收 |
|------|-------|------|--------------|-----------|
| Stripe $50 場 × 14 人 | $735 | -$35 | -$33.49 ($2.35×14 + 3.4%) | **$666.51** |
| PayMe $50 場 × 14 人 | $735 | -$35 | -$10.5 (1.5%) | **$689.50** |
| FPS 手動 $50 場 × 14 人 | $700 | $0 | $0 | **$700**（要 Admin 自己對數） |

→ **平台主推 PayMe**，毛利率反而健康過 Stripe。

### 5.4 退款政策（v2 新增）
- Admin 喺發起活動時設定 cancellation policy：
  - **A. 全退**：開賽前 24h 退 100%，之後唔退
  - **B. 半退**：開賽前 48h 100%、24h 內 50%、6h 內 0%
  - **C. 不退**：報名即不退（適合場租已付）
- 球員報名時 modal 必須勾「我同意退款政策」
- Admin 仍可手動 override 全退（特殊情況）

---

## 6. 場地資料庫 v2 — 解決真實痛點

### 6.1 Reality Check
v1 嘅「下拉揀場 + 導航」只係**最後一公里**價值。香港球隊每月最痛係**每月 1 號上康文署搶場**。v2 補上：

### 6.2 v2 場地功能分層
| 層級 | 功能 | Phase |
|------|------|-------|
| L1 | 場地 metadata (地址、surface、經緯度、聯絡電話) | MVP |
| L2 | 一鍵 Google / Apple Maps 導航 | MVP |
| L3 | 「我已 book 呢個場」標記 + 上傳康文署 confirmation | Phase 2 |
| L4 | 月初康文署搶場提醒 (calendar reminder + checklist) | Phase 3 |
| L5 | 球隊間共享空場 (A 隊 booking 時段轉讓 B 隊) | Phase 4 |

### 6.3 活動分類（v2 新增）
發起活動時揀：
- **已 book 場**（顯示 confirmation）
- **想搵場**（系統幫手 match 同區未滿球隊）→ 進入 Friendly Match (§8.1)
- **室內 / 私營場**（自由填）

---

## 7. 通知策略 v2

### 7.1 Channel Matrix
| 通知類型 | Push | Email | WhatsApp Link | SMS |
|---------|:----:|:-----:|:-------------:|:---:|
| 一般 RSVP 提醒 | ✅ | ❌ | ❌ | ❌ |
| 候補成功 | ✅ | ✅ | ❌ | ❌ |
| **搶位模式 (time-critical)** | ✅ | ✅ | ✅ | ✅ (Pro+ only) |
| 扣 Token 提醒 | ✅ | ✅ | ❌ | ❌ |
| 賽後數據出爐 | ✅ | ❌ | ❌ | ❌ |
| Owner 後台事宜 | ✅ | ✅ | ❌ | ❌ |

### 7.2 WhatsApp Click-to-Chat
- 唔走 WhatsApp Business API（貴 + 審批煩）
- 用 `https://wa.me/?text=...` deep link，由用戶自己揀「分享去 WhatsApp 群」
- 系統提供 prebuilt template 文字，一 click 複製

### 7.3 用戶通知 Preferences
- Settings → Notifications：每個 channel × 每個事件類型 toggle
- 預設**搶位模式打開所有 channel**（time-critical 唔可以靜音）

---

## 8. 成長引擎 v2 — 新增模組

### 8.1 Friendly Match Matchmaking (Phase 3)
> 解決：球隊夾唔到對手，被迫去 Joyso 約戰 → 流失 engagement

- Admin 可發起 **「Open Challenge」**：選日期、地區、水平 (1-5★)、預算
- 系統 push 同區球隊 Admin
- 雙方確認後自動建活動，雙方球員同步 RSVP
- **平台抽成位**：場租分賬可選用平台 split payment，抽 3%

### 8.2 球員客串系統 (Phase 3)
> 解決：A 隊唔夠人 → 而家要去 WhatsApp 求救 + 散水餅引人

- Admin 喺活動 detail 點「邀請客串」
- 系統 surface「同區、同水平、最近活躍」嘅球員
- 客串球員加入唔扣自己 Token（一次性 guest pass）
- **Viral loop**：客串球員體驗到產品 → 邀返自己球隊

### 8.3 球季制 (Phase 3)
- 每 3 個月為一個 Season
- Season 結束有總結頁（戰績、最佳球員、最佳賽事）
- 自動生成 **Share Card**（IG Story 9:16）→ 帶水印 → 免費獲客
- Pro 隊伍 Share Card 無水印

### 8.4 Share Card (Phase 2 提前到 MVP+1)
- 賽後 Admin 填完數據，一 click 生成可分享圖
- 內容：比數、最佳球員、進球者、球隊 logo
- 預設帶 `Powered by TEAMSPIRIT` 水印（Pro 可移除）
- 香港 IG Story 文化頂盛，呢個係**最大病毒槓桿**

---

## 9. 私隱 / 法務 (v2 新增)

### 9.1 個人數據 Ownership
- 球員嘅出席率 / 進球 / 助攻 = **Co-owned**（球員 + 球隊）
- 球員退隊：自己嘅總和數據可繼續 view + export，但**球隊 view 中佢嘅紀錄變 anonymized** (`Player #4` 取代名)
- 球員可申請永久刪除個人數據（GDPR right to erasure），需 14 日冷靜期

### 9.2 球隊解散 / 刪除
- Owner 點「刪除球隊」→ 雙重確認（輸入球隊全名 + Email OTP）
- 30 日冷靜期（可恢復）→ 之後 hard delete
- 冷靜期內自動 export ZIP 寄俾全體成員（含個人歷史數據）

### 9.3 Owner 轉讓
- 流程：Owner 揀新 Owner → 對方 Email OTP 確認 → 7 日鎖定期（雙方都唔可以再轉） → 生效
- 鎖定期防 social engineering 攻擊

### 9.4 私隱條款重點
- 撞波預警**只比對自己日曆**，**從不**披露其他隊內容
- 用戶頭像 / Logo 上傳通過 Cloudflare R2 + Image moderation
- Cookie / Analytics: 用 Plausible (cookieless)，避免 GDPR / 私隱條例 cookie banner 煩

---

## 10. MVP Roadmap v2 — 砍至 6 週可上線

### Phase 0: Closed Beta (Week 1-6) ✂️ 大幅瘦身
> **目標**：種子 10-20 隊、驗證 RSVP retention
- ✅ Email / Google Sign-In
- ✅ 創隊（**完全免費，無 3 槽位限制**）
- ✅ 開活動（純免費）
- ✅ RSVP（出席 / 缺席 / 候補 FIFO）
- ✅ 場地下拉（手動 seed 50 個熱門場）
- ✅ Mobile-first PWA（唔出 native app）
- ❌ **暫無 Token、無 Stripe、無賽後數據** — 全部押後

> **退出 criteria**：4 週後 ≥ 50% 球隊仲喺度開新活動 → 進 Phase 1。否則 pivot。

### Phase 1: Monetization (Week 7-14)
- Token 系統 + Stripe / PayMe 入金
- 收費活動 + 強制先付款後佔位
- **雙階段候補搶位**（§4 完整 state machine）
- FPS 手動模式（fallback）
- Lite + Pro 月費

### Phase 2: Engagement (Week 15-22)
- 賽後數據（比數、進球、助攻、紅黃牌）
- **Share Card** 病毒模組
- 天文台 API + 撞波預警
- 通知 Preferences (§7)

### Phase 3: Network Effects (Week 23-32)
- Friendly Match Matchmaking
- 球員客串系統
- 球季制 + Season Recap
- 進階雷達圖（Pro）

### Phase 4: Moat (Week 33-44)
- 康文署搶場提醒 + checklist
- 球隊間 booking 轉讓
- 品牌客製化（Logo / 主題色 / 去水印）
- 進階財務報表 export
- 場地共享 marketplace

---

## 11. Success Metrics

### 11.1 North Star
> **Weekly Confirmed RSVPs per Active Team** ≥ 8（即每隊每週至少有 8 個有效出席確認）

### 11.2 Funnel
| 階段 | Metric | Phase 0 目標 | Phase 2 目標 |
|------|--------|-------------|-------------|
| Acquisition | 新隊註冊 / 週 | 5 | 50 |
| Activation | 7 日內首場活動有 ≥ 5 RSVP | 60% | 75% |
| Retention | 4 週後仍開活動嘅球隊 % | 50% | 70% |
| Monetization | Free → 付費轉化率 | n/a | 8% |
| Referral | Share Card / 場 | n/a | 1.5 |
| **ARPU** | 月均收入 / 付費隊 | n/a | $42 |

### 11.3 Counter-metrics（防作弊）
- Push opt-out rate < 15%
- 退款率 < 3%
- Support ticket / DAU < 1%

---

## 12. UI / UX 設計
*(維持 v1 設計風格，新增以下要求)*

### 12.1 額外要求
- **搶位模式**：全螢幕 takeover modal、心跳脈衝動畫、倒數紅色變色
- **Share Card 預覽**：所見即所得 editor，可換 background template
- **Pro 升級 hook**：邊個免費功能 lock 都用同一套 upgrade modal，A/B test 文案

### 12.2 響應式
- Mobile-first（PWA installable）
- Tablet：dashboard 變兩欄
- Desktop：sidebar + 數據看板模式（適合 Owner 後台）

---

## 13. Open Questions（v2 待解決）
1. **PayMe for Business API** 真係未開放俾第三方？需要再 confirm（如未開放，Phase 1 就要靠 Stripe 撐住）
2. **康文署 booking confirmation 格式** — 影相 OCR 定純人手 input？
3. **球員客串是否需要 Owner 預先 approve**，定信任 Admin 即時 invite？需要 founder 拍板
4. **Pro $78 定價** — 競品最貴 ~$50，需要做 willingness-to-pay 訪談 5 個 Owner
5. **Friendly Match 跨隊抽成** — 3% 是否會令球隊轉返用 WhatsApp 私下約？需要實測

---

## 附錄 A：v1 → v2 變更清單
| 章節 | 變更 |
|------|------|
| §3 Token 經濟 | 新增 Lite $28/月、補完寬限期 UI、扣款提醒、自動補 Token、Worked Example |
| §4 候補機制 | 補完時區、釐清 FIFO 鎖位邏輯、補上 6 個 edge case |
| §5 支付 | 提前 PayMe 至 Phase 1、補完 Stripe Connect onboarding、加入退款政策、實算 unit economics |
| §6 場地 | 5 層分階段功能、活動分類（已 book / 想搵場 / 私營） |
| §7 通知 | Channel Matrix、WhatsApp Click-to-Chat fallback、用戶 preferences |
| §8 (新) | Friendly Match、客串、球季、Share Card 四大成長引擎 |
| §9 (新) | 私隱 / 個資 / Owner 轉讓 / 球隊刪除流程 |
| §10 Roadmap | 砍 Phase 0 至 6 週 closed beta，先驗證 retention 才收費 |
| §11 (新) | North Star + 完整 funnel metrics |
