# TEAMSPIRIT — Product Requirements Document v3

> **v3 核心轉向**：放棄 Token + 槽位混合模型，改採 **Marketplace-First, SaaS-Second** —— 100% 免費獲客、向交易抽成、Pro 月費換「賺更多嘅工具」。整合 v2 之後 13 個修改建議。

---

## 0. 文件版本紀錄
| 版本 | 日期 | 主要改動 |
|------|------|---------|
| v1 | — | 初版定義核心功能 + 4 階段 Roadmap |
| v2 | 2026-04 | 補完邊緣案例、加入成長引擎、收緊 MVP 範圍 |
| v3 | 2026-04 | **重構商業模型至 Marketplace-First**；解決 v2 13 個漏洞；onboarding flow + customer support 補齊 |

---

## 1. 競品定位

### 1.1 一句話
> 「為香港業餘足球隊而設嘅指揮中心 — 從報名到出糧，一個 App 解決，免費。」

### 1.2 核心差異
| 競品 | 弱點 | TEAMSPIRIT |
|------|------|-----------|
| WhatsApp Group | 洗版、人手點名、收錢走數 | 自動化引擎 + 平台代收 |
| Joyso | 偏跨隊約戰、弱內部管理 | 內部管理為主，**保留約戰入口** |
| Meetup | 抽成貴、無足球專屬 | **完全免費 + 4% 透明 service fee** |
| 康文署 LCSD | 抽籤、PC 操作、不能管隊 | Phase 4 整合私營場 marketplace |

---

## 2. 用戶角色與權限矩陣
（同 v2 一樣，新增 export 權限）

| 功能 / 角色 | Owner | Admin | Member | Guest |
|------------|:-----:|:-----:|:------:|:-----:|
| 查看公開資訊 | ✅ | ✅ | ✅ | ✅ |
| 報名 / 出席活動 | ✅ | ✅ | ✅ | ❌ |
| 查看個人數據 | ✅ | ✅ | ✅ | ❌ |
| 發起 / 取消活動 | ✅ | ✅ | ❌ | ❌ |
| 填寫賽後數據 | ✅ | ✅ | ❌ | ❌ |
| 審批成員加入 | ✅ | ✅ | ❌ | ❌ |
| 踢除成員 / Admin | ✅ | （只一般成員） | ❌ | ❌ |
| 設定 Payout / 處理退款 | ✅ | ❌ | ❌ | ❌ |
| 轉讓 Owner / 刪除球隊 | ✅ | ❌ | ❌ | ❌ |
| Export 個人歷史數據 | ✅ | ✅ | ✅ | ❌ |
| Export 球隊財務報表 | ✅ | ❌ | ❌ | ❌ |

---

## 3. 商業模型 v3 — Marketplace-First

### 3.1 設計原則
1. **冇月費 ≠ 冇收入**：用戶用得越多，平台賺得越多（B2B2C marketplace 邏輯）
2. **解鎖價值，唔係解鎖限制**：Pro 月費賣「賺更多嘅工具」，唔係「移除 artificial 限制」
3. **零摩擦 onboarding**：新用戶 30 秒內可以用到所有核心功能
4. **透明 fee**：球員自己睇到 4% service fee，唔係偷偷加

### 3.2 三層模式

#### L1 · Free Forever（永久免費）
- ✅ 無限制建隊、加入球隊
- ✅ 無限制活動（免費或收費）
- ✅ 全部 RSVP / 候補 / 搶位機制
- ✅ 賽後數據（比數、進球、助攻、紅黃牌）
- ✅ 場地資料庫 + 一鍵導航
- ✅ 撞波預警 + 天文台天氣
- ✅ 終身個人數據（**v2 原本只 3 個月，v3 改為終身**，免費版唯一限制：唔顯示雷達圖）
- ❌ 無自訂主題、無 Logo、有 `Powered by TEAMSPIRIT` 水印

#### L2 · Transaction Fee（主收入線）
- 球隊用平台收場費 → **球員側加 4% service fee**（透明顯示）
- 例：報名費 $50 → 球員結帳 $52（系統抽 $2，扣 Stripe / PayMe 手續費後 platform net ~$1）
- **Pro 球隊抽 2%**（半價，不是 0%，避免濫用）
- FPS 手動模式：**0% 抽成**，但 Admin 要自己對數（fallback 永遠存在）
- 不可抗力（黑雨、8 號風球、場地 force cancel）→ 100% 退款，不抽成

#### L3 · Pro 月費 $48/月（Pro 球隊）
**Pro 解鎖嘅唔係「冇限制」，係「賺更多 / 慳更多」嘅工具：**
- 🎨 客製化 Logo + 主題色 + 移除水印（球隊形象 → 吸新球員）
- 📊 雷達圖 + 進階數據 dashboard（球員留存）
- 💸 **Transaction fee 半價**（4% → 2%，月成交額 $5,000 已經回本）
- 📈 球隊財務報表 export (PDF / Excel)
- 🎫 每月 1 張 **Welcome Match 試踢券**（送新人免費試踢一場，獲客工具）
- 🎯 Friendly Match 優先 matching（同區 Pro 球隊優先配對）
- 💬 優先 in-app 客服（response < 4h workday）
- 🏆 Season Recap 自動生成（Pro 隊伍 shareable 戰報無水印）

#### L4 · 進階收入（Phase 4+）
- **私營場 Marketplace** — 球隊 book 場拆賬 8-10%
- **球衣 / 裝備 dropship** — Pro 球隊客製，平台抽 15%
- **意外保險 channel** — 業餘足球意外險 $20/人/月，平台抽 30%

### 3.3 v3 拋棄咗咩（vs v2）
| v2 機制 | v3 處理 | 理由 |
|---------|---------|------|
| Token 系統 | ❌ 完全砍 | 增加認知負擔；扣款投訴風險；阻礙 onboarding |
| 3 / 5 / 20 槽位限制 | ❌ 完全砍 | 假稀缺；無真實成本；逼走 viral growth |
| 30 日週期續扣 | ❌ 完全砍 | 連鎖效應，球員退隊 / 補位變糟糕 UX |
| Lite $28 月費 | ❌ 砍 | 中間產品 cannibalize Pro |
| 自動補 Token | ❌ 砍 | dark pattern 風險高 |

### 3.4 Unit Economics 預測（1,000 active teams）
假設 30% 球隊用 transaction，平均每隊每月 4 場 × 14 人 × $50：

| 收入線 | 月收入 | 備註 |
|--------|-------|------|
| Transaction fee (Free 球隊 4%) | $26,880 | 250 × 4 × 14 × $50 × 4% |
| Transaction fee (Pro 球隊 2%) | $2,800 | 50 × 4 × 14 × $50 × 2% |
| Pro 月費 | $2,400 | 50 × $48 |
| **總月入** | **~$32,000** | |
| 減 Stripe / PayMe 處理費 | -$15,000 | 約佔 transaction 50% |
| 減 infra / 客服 | -$5,000 | |
| **淨利** | **~$12,000** | 早期可持續 |

到 5,000 teams scale 時，月淨利 ~$60,000-100,000，加上 L4 marketplace 線可翻倍。

### 3.5 Pro 抽成 Cap（防濫用）
v2 提出嘅問題：「Pro $48 + 0% 抽成會被高交易額球隊濫用」
- v3 解法：**Pro 抽成 = 2%（半價，不歸零）**
- 月成交 $5,000 已平回月費，但平台仍有 $100 transaction 收入
- 月成交 $50,000 嘅大隊：平台收 $1,000 + $48 月費 = $1,048 vs Free 球隊嘅 $2,000，雙方都能接受

---

## 4. 雙階段候補機制 v3 — 完整 State Machine

### 4.1 時區
所有「活動當天 00:00」以 `event.venue.timezone` 為準，預設 `Asia/Hong_Kong`，跨境活動 Owner 揀。

### 4.2 第一階段（活動日前）
- 觸發：`ATTEND` → `DECLINE`
- 系統按 `waitlist[0].joinedAt` FIFO 自動遞補
- 自動扣款失敗 → 5 秒 retry 一次 → 仍失敗 → 跳下一位

### 4.3 第二階段（搶位模式）
**Click 鎖位 + 限時付款**，鎖位採 FIFO 排隊：
```
[Spot Released]
      │
      ▼
[Push / Email / WhatsApp Bot 推送俾所有候補]
      │
      ▼
┌──────────────────────────────────────┐
│ Reservation Queue (FIFO)             │
│  - 第 1 位 click = 進入 10 分鐘付款   │
│  - 第 2、3 位繼續排（顯示「你係第 N 位」）│
│  - 第 1 位 timeout / 付款失敗 → 第 2 位上 │
│  - 第 1 位付款成功 → 釋放 2-N 位回候補 │
└──────────────────────────────────────┘
```

### 4.4 邊緣案例（v2 已 cover，v3 修正一處）
| 情境 | v3 處理 |
|------|---------|
| 第 1 位鎖位中、原退出者改回 ATTEND | **拒絕 reverse**，必須走 join waitlist 流程 |
| 鎖位中又有新位釋放 | 新位獨立行同樣流程，並行進行 |
| **Admin 手動加人** | **v3 修正：唔再扣 Admin 任何嘢**，直接 mark `PAID by Admin (代付)`，球隊內部 settle |
| 球員雙開兩個位 | Lock by user_id，每 user 同時刻只能持有 1 個 active reservation |
| Push 失敗 | Fallback：Email + WhatsApp Bot deep link |

### 4.5 鎖位倒數 UI
- 全螢幕 takeover、心跳脈衝動畫
- 最後 60 秒紅色變色 + 設備震動
- 超時自動釋放，顯示「下次手快啲」彩蛋

---

## 5. 支付 / 退款流程 v3

### 5.1 支付方式優先序
1. **PayMe for Business**（最大 HK 通道）
2. **FPS 手動入數截圖**（零門檻 fallback）
3. **Stripe Card / Apple Pay / Google Pay**（跨境 / 高客單）

### 5.2 Stripe Connect Onboarding 友善化
- 個人 Admin 用 Stripe Express + HKID + 個人銀行戶口
- 中文 wizard，每步配截圖
- Onboarding 失敗 / 唔想搞 → 自動降級至 FPS 手動，**唔阻塞用戶用其他功能**

### 5.3 平台抽成（v3 釐清）
| 模式 | Free 球隊 | Pro 球隊 |
|------|-----------|---------|
| Stripe / PayMe | 4% | 2% |
| FPS 手動 | 0% | 0% |
- 抽成由**球員付**（透明顯示「+4% 平台手續費」），唔偷偷加
- 不可抗力 100% 退款，不抽成（綁定天文台 API）

### 5.4 退款政策（v3 補完）
Admin 發起活動時揀 cancellation policy：
- **A. 全退**：開賽前 24h 100%，之後不退
- **B. 半退**：48h 前 100% / 24h 前 50% / 6h 前 0%
- **C. 不退**：報名即不退（場租已付情境）
- **D. 自動：跟天氣**（綁定天文台 API，掛 8 號 / 黑雨自動全退）

球員報名時 modal 必須勾「我同意退款政策」+ 顯示天氣自動退款例外。

### 5.5 不可抗力（Force Majeure）自動退款（v3 新增）
- 觸發條件：天文台 8 號風球 / 黑雨 / 球場 force closure
- 系統自動：取消活動 + 全員 100% 退款 + 不抽成
- Admin 唔可以 override（保護球員）
- 球員 push 通知：「因天文台 X，活動已自動取消，款項 3-5 工作日退回」

---

## 6. 場地資料庫 v3

### 6.1 分階段功能
| 層級 | 功能 | Phase |
|------|------|-------|
| L1 | 場地 metadata + Maps 導航 | MVP |
| L2 | 「我已 book 呢個場」標記 + confirmation 上傳 | Phase 2 |
| L3 | **私營場 Marketplace**（v3 新增為主軸）| Phase 4 |
| L4 | 球隊間 booking 轉讓 | Phase 4 |
| ❌ | ~~康文署搶場提醒~~（v3 砍）| — |

### 6.2 v3 為何砍康文署提醒
- 康文署係**月頭抽籤** + 隨機派籌，提醒 useless
- 真痛點係**抽唔到場** → 要去**私營場**
- 改為主推 **私營場 marketplace**：商業模式更直接（抽 8-10%）

### 6.3 活動分類
- **已 book 場**（顯示 confirmation）
- **想搵場**（系統幫 match 同區未滿球隊 → Friendly Match）
- **私營場 booking**（Phase 4 marketplace 整合）

---

## 7. 通知策略 v3 — 解決 Push 覆蓋率問題

### 7.1 現實問題
iOS Safari Push 喺 PWA 上 deliverability < 20%（要 install + iOS 16.4+）。**搶位模式 10 分鐘窗口依賴 push** → 高風險 broken。

### 7.2 v3 解法：**Native App + WhatsApp Bot 雙保險**

#### a. Phase 0 就 commit Native App
- 用 **Expo (React Native)** wrap，share 80% codebase
- iOS App Store + Google Play 上架
- Push 走 APNS / FCM，deliverability > 90%

#### b. WhatsApp Bot Fallback（time-critical only）
- 用戶 onboarding 時 opt-in 一次（QR code scan 加 bot）
- 搶位模式 + 不可抗力退款 → bot push 1-on-1 message
- **唔走 WhatsApp Business API**（貴 + 審批），用 [Twilio WhatsApp Sender](https://www.twilio.com/whatsapp) 或 [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- 估計成本 $0.01-0.03 / message，主動 throttle 至每 user 每月 < 5 條

### 7.3 Channel Matrix
| 通知類型 | App Push | Email | WhatsApp Bot | SMS |
|---------|:--------:|:-----:|:------------:|:---:|
| 一般 RSVP 提醒 | ✅ | ❌ | ❌ | ❌ |
| 候補成功 | ✅ | ✅ | ❌ | ❌ |
| **搶位模式** | ✅ | ✅ | ✅ | Pro+ only |
| **不可抗力退款** | ✅ | ✅ | ✅ | ❌ |
| 賽後數據 | ✅ | ❌ | ❌ | ❌ |
| Owner 後台 | ✅ | ✅ | ❌ | ❌ |

### 7.4 用戶 Preferences
Settings → Notifications：每 channel × 每事件 toggle，搶位 / 不可抗力**唔可以靜音**（強制 on）。

---

## 8. 成長引擎 v3

### 8.1 Friendly Match Matchmaking（Phase 3）
- Admin 發 Open Challenge：日期、地區、水平 1-5★、預算
- 系統 push 同區球隊
- **首場必須經平台 split payment**（綁優惠：免費取消保險）
- 之後可以選擇繼續用平台（4% transaction fee）或私下交易（平台不阻止）

### 8.2 球員客串系統（Phase 3）
- Admin 喺活動「邀請客串」
- 系統 surface 同區、同水平、最近活躍球員
- 客串球員加入**不收任何 fee**
- Viral loop：客串球員體驗到產品 → 邀返自己球隊

### 8.3 球季制 + Season Recap（Phase 3）
- 每 3 個月一個 Season
- Season 結束自動生成 IG Story 9:16 Share Card
- 內容：戰績、最佳球員、進球榜、Top 5 highlights
- Free 球隊有水印，Pro 無

### 8.4 Share Card（**MVP+1 提前**）
- 賽後 Admin 填完數據，一 click 生成可分享圖
- 包含比數、最佳球員、進球者、球隊 Logo
- **獲客最強槓桿**：HK IG Story 文化頂盛
- 預設帶 `Powered by TEAMSPIRIT` 水印（Pro 無）

### 8.5 Public Pickup Match — 公開約波（v3.1 新增，Phase 0+1）
**最大 organic discovery 引擎，補完「散兵游勇」用戶 segment**

#### 痛點
- 一個人 book 咗場但夾唔夠人 → 而家要 spam WhatsApp 群求人
- 想踢波但冇隊 → 完全冇入口，只能 lurk 在 Joyso

#### 功能
- 任何 user (不論 team affiliation) 可發起 **公開場 (Public Pickup Match)**
- 必填：場地、日期時間、人數上限、報名費 / 人、水平要求 (1-5★)、退款政策
- 選填：booking proof 上傳 → 顯示「已驗證」badge（防 fake match 騙錢）
- 全平台用戶可喺 \`/discover\` 睇到、按地區 / 日期 / 水平 / 場地類型 filter
- 一鍵報名 + 平台代收 4% service fee（同球隊收費活動相同）
- 報名後加入 attendees roster，host 有 kick / cancel 權

#### Host Reputation 系統
- 每位 host 累計：主辦次數、準時率、平均評分（球員賽後評）
- 高評分 host 嘅場優先 surface
- 低評分 / 多投訴 → 自動降權 + 人手 review

#### 商業價值
1. **獲客**：完全 organic，不限球隊 viral 邊界
2. **transaction GMV**：每場 14 人 × $50 × 4% = $28，純 host 個人都貢獻收入
3. **球員轉化**：散兵 → 試完一兩場 → 主動找隊 / 自己組隊
4. **場地反向利用率**：解決私人 booking 嘅空位浪費

#### 邊緣案例
- Host 不出現 / 場地有 issue → 球員一鍵申訴，平台 escalation + 退款
- 防殭屍 / fake match：booking proof 驗證、host reputation 門檻、新 host 首場限報名上限 8 人
- 報名後 host 取消：100% 退款 + host reputation -1
- 球員無故甩底 (no-show)：扣 reliability score，3 次以上限制報名

#### 與球隊功能嘅 boundary
- 公開場 ≠ 球隊活動（無 team affiliation）
- 球員報名公開場唔需要加入任何球隊（reduce friction）
- Host 可以選「呢個公開場 attribute 俾我嘅 X 球隊」，數據貢獻俾球隊 stats

### 8.6 Welcome Match 試踢券（Pro 獨家）
- Pro 球隊每月 1 張
- 邀請新球員試踢一場，**球員費用由平台補貼**（capped at $80）
- 用作 acquisition 工具
- 限制：每球員終身只可用 1 次（防 abuse）

---

## 9. Onboarding Flow（v3 新增）

### 9.1 Owner 首次體驗（30 秒目標）
```
Sign Up (Google / Email / Apple)
   │
   ▼
[Welcome] 「踢邊個位置？」（單選，用作 personalize）
   │
   ▼
[Step 1/3] 建立你嘅球隊
   ├── 球隊名稱（required）
   ├── 主場地區（HK 18 區下拉）
   ├── Logo（optional，可後補）
   └── ✓ Skip 都得，一鍵跳過
   │
   ▼
[Step 2/3] 邀請隊友
   ├── 一鍵 share WhatsApp link（最 viral）
   ├── 直接輸入 email
   └── ✓ Skip 都得
   │
   ▼
[Step 3/3] 開第一個活動
   ├── 預填：今個星期日下午 3 點、就近熱門場
   ├── Owner 只需 confirm
   └── 一 click 完成
   │
   ▼
[Done] Confetti animation + 引導去 Dashboard
```

### 9.2 Activation Checklist（Dashboard 常駐）
- ☐ 建立球隊
- ☐ 邀請至少 5 個成員
- ☐ 開第一個活動
- ☐ 收到第一個 RSVP
- ☐ 完成第一場活動 + 填數據
- 完成全部 → 解鎖「Founding Member」badge + 第一個月 Pro 試用

### 9.3 Activation 量度
- **D1**：完成 Step 1-3 嘅比例（target: 80%）
- **D7**：邀請到 ≥ 5 成員嘅球隊比例（target: 60%）
- **D14**：開到第一個活動嘅球隊比例（target: 50%）

---

## 10. Customer Support（v3 新增）

### 10.1 Channel
- **In-app chat**：用 Crisp 或 Intercom，中文 support
- **Email**：support@teamspirit.hk（24h response）
- **FAQ self-service**：built-in help center，~50 articles 開站

### 10.2 SLA
| 用戶層 | Response | Resolution |
|--------|----------|-----------|
| Free | < 24h workday | best effort |
| Pro | < 4h workday | < 48h |
| 付款 / 退款投訴 | < 2h（all tier）| < 24h |

### 10.3 Office Hour
- 週一至五 10am-7pm HKT
- 週末有 chatbot + emergency 人手 backup（搶位 / 退款 issue）

### 10.4 自助工具
- 退款一鍵申請（Owner override）
- 球員 export 個人數據 button
- 球隊 export 完整數據 button（GDPR right to portability）

---

## 11. 私隱 / 法務 v3

### 11.1 個人數據 — 修正 v2 匿名化問題
v2 提「球員退隊變 `Player #4`」技術上難 enforce（截圖 / Share Card 已外傳）。v3 改為**球員自選**：

| 球員選項 | 球隊 view | 個人歷史 | 賽後截圖 |
|---------|----------|---------|---------|
| **A. 軟刪除（預設）** | 顯示「前成員」+ 名 | 保留 | 保留歷史截圖原樣 |
| **B. 硬刪除** | 完全消失 | 完全洗 | **球隊 export PDF 中匿名化**（v3 限制：只 cover 平台內 record，外傳截圖無能力處理） |

明確告訴用戶：「呢個 App 內部會清，但你之前有人 screen cap 我哋無能力收返」。

### 11.2 球隊解散
- Owner 點刪除 → 雙重確認（輸入球隊全名 + Email OTP）
- **30 日冷靜期**（可恢復）→ hard delete
- 冷靜期內自動 export ZIP 寄全體成員（含個人歷史）

### 11.3 Owner 轉讓
- Owner 揀新 Owner → 對方 Email OTP 確認 → **7 日鎖定期** → 生效
- 鎖定期防 social engineering 攻擊

### 11.4 私隱原則
- 撞波預警**只比對自己日曆**，從不披露其他隊內容
- Logo / 頭像上傳 → Cloudflare R2 + image moderation API
- Analytics 用 Plausible（cookieless），避免 cookie banner
- 完全符合香港 PCPD 私隱條例 + GDPR data portability / right to erasure

### 11.5 自動扣款保護（v3 修正 v2 dark pattern 風險）
- 因 v3 砍咗 Token，「自動補 Token」邏輯刪除
- Pro 月費續費：T-3 日 email 提醒 + 一鍵 cancel link
- 退款 policy：取消後當月已扣費可申請 prorated 退款

---

## 12. MVP Roadmap v3 — 6 週上線

### Phase 0: Closed Beta（Week 1-6）
**目標：種子 10-20 隊 + 5-10 個獨立 host、驗證 RSVP retention + 公開約波 marketplace 流動性**
- ✅ Sign-In (Google / Email / Apple)
- ✅ Onboarding flow（§9）
- ✅ 建隊（無上限）
- ✅ 開活動（純免費）
- ✅ **公開約波 (Public Pickup Match) 基礎版（§8.5）— 任何人 host、任何人報、純免費**
- ✅ RSVP（出席 / 缺席 / 候補 FIFO）
- ✅ 場地下拉（手動 seed 50 個熱門場）
- ✅ Share Card 基礎版（無水印選項）
- ✅ Native App (Expo) — iOS + Android 同步
- ❌ **暫無收費活動、無 Stripe、無賽後詳細數據**

**退出 criteria**：4 週後 ≥ 50% 球隊仍開新活動 → 進 Phase 1。否則 pivot。

### Phase 1: Monetization（Week 7-14）
- Stripe / PayMe 收費活動 + 4% transaction fee
- FPS 手動模式 fallback
- 雙階段候補搶位（§4）
- 不可抗力自動退款（§5.5）
- **WhatsApp Bot fallback**

### Phase 2: Engagement（Week 15-22）
- 賽後完整數據（比數、進球、助攻、紅黃牌）
- Pro 月費 $48 launch（client branding + 雷達圖 + 2% transaction fee）
- 天文台 API 完整整合
- Customer support 系統 launch

### Phase 3: Network Effects（Week 23-32）
- Friendly Match Matchmaking
- 球員客串系統
- 球季制 + Season Recap auto-generate
- 進階雷達圖 + 終身歷史 dashboard
- Welcome Match 試踢券 launch

### Phase 4: Marketplace Moat（Week 33-44）
- 私營場 Marketplace（Phase 4 主軸）
- 球隊間 booking 轉讓
- 球衣 / 裝備 dropship channel
- 意外保險 channel partnership
- 進階財務報表 export

---

## 13. Success Metrics v3

### 13.1 North Star（v3 修正）
> **「7 日內球隊有 ≥ 1 場活動實際開波（出席 ≥ 7 人）」嘅 active teams 比例**

唔再用 vanity 嘅 RSVP count（容易刷數），改用「真係踢咗波」嘅 proxy。

### 13.2 Funnel Metrics
| 階段 | Metric | Phase 0 | Phase 2 | Phase 4 |
|------|--------|---------|---------|---------|
| Acquisition | 新隊註冊 / 週 | 5 | 50 | 200 |
| Activation (D1) | 完成 onboarding 3 步 | 80% | 80% | 80% |
| Activation (D14) | 開第一個活動 | 50% | 60% | 70% |
| Retention (W4) | 仍開活動嘅球隊 | 50% | 65% | 75% |
| **North Star (W4)** | **真開波 ≥ 1 場 / 週** | 30% | 50% | 65% |
| Monetization (用 transaction) | Free → 用 platform 收錢 | n/a | 25% | 40% |
| Monetization (Pro) | Free → Pro 轉化 | n/a | 5% | 10% |
| Referral | Share Card / 場 | n/a | 1.5 | 3.0 |
| ARPU (per active team) | 月均收入 | n/a | $30 | $50 |

### 13.3 Counter-metrics（防作弊）
- Push opt-out rate < 15%
- 退款率 < 3%
- Support ticket / DAU < 1%
- WhatsApp Bot opt-out < 20%

---

## 14. UI / UX 設計

### 14.1 設計風格
- 運動科技風（Sports Tech），深色模式為主
- 螢光綠 / 活力橘作為 accent
- Mobile-first（PWA installable + Native App）
- Card-based、rounded-2xl、glassmorphism

### 14.2 關鍵 UI 規範
- **搶位模式**：全螢幕 takeover、心跳脈衝動畫、倒數紅色變色
- **Share Card 預覽**：所見即所得 editor、可換 background template
- **不可抗力提示**：天文台警告 banner，全屏 alert
- **Pro 升級 hook**：每個 Pro 功能 lock 都用同一套 upgrade modal，A/B test 文案

### 14.3 響應式
- Mobile（手機）：bottom tab bar
- Tablet：dashboard 兩欄
- Desktop：sidebar + 數據看板（Owner 後台）

---

## 15. Open Questions（v3 收窄至 3 條）

1. **PayMe for Business API** 真係未開放第三方？需 confirm（如未開放，Phase 1 靠 Stripe + FPS 過渡）
2. **Native App vs PWA-only** 嘅資源投入 trade-off — Expo 寫一次但仍要 App Store review。需要 founder 拍板 Phase 0 vs Phase 1 launch
3. **Pro $48 定價** — 競品最貴 ~$50，需要做 willingness-to-pay 訪談 5 個 Owner

---

## 附錄 A：v2 → v3 變更清單

| 章節 | v3 變更 |
|------|---------|
| §1 競品 | 一句話加「免費」字眼，confirm marketplace 邏輯 |
| §3 商業模型 | **完全重構**：砍 Token / 槽位 / Lite / 自動補款；改 Free + Transaction Fee + Pro $48 三層；加 unit economics + Pro cap |
| §4.4 候補 | Admin 手動加人**唔再扣 Token**，直接 mark `代付` |
| §5.4 退款 | 加「D. 跟天氣自動」option |
| §5.5 不可抗力 | **全新章節**：天文台 8 號 / 黑雨自動全退、不抽成 |
| §6 場地 | **砍康文署提醒**，改主推私營場 marketplace（Phase 4） |
| §7 通知 | **解決 Push 覆蓋率**：Phase 0 commit Native App + WhatsApp Bot fallback |
| §8.4 Share Card | 從 Phase 2 提前到 MVP+1（最大 viral 槓桿） |
| §8.5 Welcome Match | Pro 獨家、capped $80、終身一次 |
| §9 Onboarding | **全新章節**：30 秒 3 步 flow、activation checklist、量度指標 |
| §10 Support | **全新章節**：channel、SLA、office hour、self-service |
| §11.1 個資 | 軟 / 硬刪除二揀一，明確告知外傳截圖無能力處理 |
| §11.5 自動扣款 | 因砍 Token，相關 dark pattern 風險清零 |
| §12 Roadmap | Phase 0 補 Native App + Share Card；Phase 4 主軸改 Marketplace |
| §13.1 North Star | 由「Confirmed RSVPs」改為「真開波 ≥ 1 場 / 週」 |
| §13.2 Metrics | 加 Native App 相關 counter-metrics |

---

## 附錄 B：商業模型推薦理由（給 Founder 拍板用）

### 為何放棄 v2 嘅 Token + Lite + Pro 三層？
1. **Token 阻 viral growth** — 朋友 invite 你入隊踢一場，你被要求充 $20？走人。
2. **30 日週期續扣 = 投訴磁石** — 香港用戶極厭惡 surprise charge，App Store 1 星評論首選 trigger。
3. **槽位限制係假稀缺** — 平台無真實成本，純粹 artificial scarcity 逼用戶升級，long-term brand damage。
4. **Lite + Pro 兩個月費 plan 互相 cannibalize** — 大部分用戶會選便宜嗰個，整體 ARPU 低過單一 Pro。
5. **複雜定價降低轉化** — Stripe 研究：每多一個 pricing option，conversion 跌 5-10%。

### 為何 Marketplace-First 啱 HK 業餘足球？
1. **金流本來就在流動** — HK 5,000 隊 × 每月 $5,000 場費 = $25M/月，平台只需 capture 1-3% = $250K-750K/月可行
2. **球員側 4% fee 心理可接受** — 比擬 Stripe 私下轉帳手續費（~3%），而且**球員自己睇到、認知佢係 service fee**
3. **Pro 唔再賣「移除限制」，賣「賺更多嘅工具」** — 客製 Logo + Welcome Match 試踢券 = ROI 直接可見
4. **完全免費獲客 → 病毒成長** — 配合 Share Card / WhatsApp 邀請，CAC 接近 $0
5. **Pro 抽成 cap at 2% 而非 0%** — 防 high-volume 球隊濫用，平台仍 share growth

### 收入結構安全嗎？
- **Free 球隊** 提供 base load + viral growth + future Pro pipeline
- **Transaction fee** 隨 GMV 自動 scale，無需主動推銷
- **Pro 月費** 係 nice-to-have、predictable revenue
- **Marketplace L4** 係 long-term moat（私營場、球衣、保險）
- **單一收入線失敗，其他線可頂住** — 比 v2 純 Token 模型抗風險強好多

→ **建議：v3 商業模型 lock，全速 Phase 0 launch**
