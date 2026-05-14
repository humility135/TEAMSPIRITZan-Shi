# Chinese UI Copy Formalization (HK Traditional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert TEAMSPIRIT Chinese UI copy to formal Hong Kong Traditional Chinese (non-colloquial), keeping second-person “你”.

**Architecture:** Only modify `translations.zh` in the i18n source file. No key changes, no logic changes, no edits to mock/user content. Verify by keyword scan + typecheck/tests.

**Tech Stack:** React (Vite), TypeScript, custom i18n dictionary.

---

## File Map

**Modify**
- [i18n.tsx](file:///workspace/artifacts/teamspirit/src/lib/i18n.tsx) — rewrite selected `translations.zh` strings to formal HK Traditional Chinese

---

### Task 1: Define a Targeted Colloquial → Formal Rewrite List

**Files:**
- Modify: [i18n.tsx](file:///workspace/artifacts/teamspirit/src/lib/i18n.tsx)

- [ ] **Step 1: Identify the highest-impact keys to rewrite**

Target keys currently containing colloquial tokens (examples from current file):
- `beHostDesc`
- `homeRadarDesc`
- `navHint`, `eventDetailMapHint`
- `teamsHeading`, `teamsDesc`, `teamsJoinDesc`, `teamsEmptyTitle`, `teamsEmptyDesc`, `teamsSearchPlaceholder`
- `teamDetailNoEvents`
- `eventDetailOfferExpired`, `eventDetailOfferWillExpire`, `eventDetailNoAttendees`, `eventDetailNotMemberCantComment`
- `publicMatchOfferExpired`
- `hostMatchDesc`, `hostMatchVenueSearch`, `hostMatchDatePlaceholder`, `hostMatchStartTimePlaceholder`, `hostMatchEndTimePlaceholder`
- `hostMatchMaxPlayersLabel`, `hostMatchMaxPlayersPlaceholder`, `hostMatchRulesPlaceholder`, `hostMatchRefundDesc`, `hostMatchDatePast`, `hostMatchMaxPlayersInvalid`
- `teamHostEventDatePlaceholder`, `teamHostEventStartTimePlaceholder`, `teamHostEventEndTimePlaceholder`, `teamHostEventCapacityLabel`, `teamHostEventMaxPlayersPlaceholder`, `teamHostEventLevelPlaceholder`, `teamHostEventDatePast`, `teamHostEventCapacityInvalid`
- `hkMapHint`
- `notCancel`

- [ ] **Step 2: Apply consistent rewrite rules**

Apply these transformations where appropriate:
- 「唔」→「不／未／無法／不得」
- 「嘅」→「的」
- 「揀」→「選擇」
- 「仲未」→「尚未」
- 「俾」→「提供／讓／予以」
- 「點」→「點選／按一下」
- 「搞手」→「主辦人」
- 「波友」→「球友」
- 「開波」→「開始比賽／開始活動」
- 「夾隊」→「組隊／組成隊伍」
- 「唔填」→「留空」

Important:
- Keep the i18n keys unchanged.
- Keep tone consistent across screens.
- Keep second-person “你”.

---

### Task 2: Rewrite `translations.zh` Copy (No Key/Logic Changes)

**Files:**
- Modify: [i18n.tsx](file:///workspace/artifacts/teamspirit/src/lib/i18n.tsx)

- [ ] **Step 1: Rewrite the strings (examples to implement exactly)**

Apply the following replacements in `translations.zh`:

```ts
beHostDesc: '無需組隊亦可參與足球活動。任何人租用場地後，均可發佈至公開市場，供其他用戶報名參加。',
notHostYet: '你尚未主辦任何比賽',

bioPlaceholder: '請簡要介紹你的球風、擅長位置等…',
peerReviews: '球友評價',

navHint: '點選「導航」即可在 Google Maps 開啟。',
eventDetailMapHint: '點選「導航」即可在 Google Maps 開啟。',

teamsHeading: '我的',
teamsDesc: '管理你的球隊、查看戰績及發起活動。',
teamsJoinDesc: '請輸入由球隊管理員提供的 6 位邀請碼。',
teamsSearchPlaceholder: '搜尋你的球隊…',
teamsEmptyTitle: '你尚未加入任何球隊',
teamsEmptyDesc: '你可以創立球隊，或使用邀請碼加入其他隊伍。',

teamDetailNoEvents: '尚未建立任何活動',

eventDetailOfferExpired: '此補位機會已過期',
eventDetailOfferWillExpire: '逾時將自動提供予下一位候補',
eventDetailNoAttendees: '尚未有人確認出席',
eventDetailNotMemberCantComment: '你並非球隊成員，無法查看留言。',

publicMatchOfferExpired: '此補位機會已過期',

hostMatchDesc: '你已租用場地但參加人數不足？你可將場次發佈至平台，開放其他用戶報名參加。',
hostMatchVenueSearch: '搜尋球場（例如：摩士公園…）',
hostMatchDatePlaceholder: '選擇日期',
hostMatchStartTimePlaceholder: '選擇開始時間',
hostMatchEndTimePlaceholder: '選擇結束時間',
hostMatchMaxPlayersLabel: '人數上限（留空表示不設上限）',
hostMatchRulesPlaceholder: '例如：不得鏟球、自備飲用水、友誼賽性質…（最少 10 字）',
hostMatchRefundDesc: '主辦人取消活動時的退款安排',
hostMatchDatePast: '不可選擇過去日期',
hostMatchMaxPlayersInvalid: '請輸入大於 0 的整數',

teamHostEventDatePlaceholder: '選擇日期',
teamHostEventStartTimePlaceholder: '選擇開始時間',
teamHostEventEndTimePlaceholder: '選擇結束時間',
teamHostEventCapacityLabel: '人數上限（留空表示不設上限）',
teamHostEventLevelPlaceholder: '選擇水平（1-5★）',
teamHostEventDatePast: '不可選擇過去日期',
teamHostEventCapacityInvalid: '人數上限必須為大於 0 的整數',

hkMapHint: '點選地圖上的地區，以選擇你的主場地區',

hostMatchMaxPlayersPlaceholder: '留空表示不設上限',
teamHostEventMaxPlayersPlaceholder: '留空表示不設上限',
notCancel: '不取消',
```

Then scan the same file for remaining colloquial tokens and rewrite them consistently:
- `唔|嘅|揀|仲未|俾|搞手|波友|點|夾|開波`

- [ ] **Step 2: Verify no i18n key mismatches**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
```

Expected:
- Exit code 0

---

### Task 3: Keyword Scan + Minimal UI Smoke Check

**Files:**
- None (verification only)

- [ ] **Step 1: Keyword scan (should be 0 or explainable)**

Run:

```bash
rg "唔|咩|我嘅|俾|揀|仲未|搞手|波友|點\\b|夾隊|開波" /workspace/artifacts/teamspirit/src/lib/i18n.tsx
```

Expected:
- Ideally no matches in `translations.zh` UI strings (some may remain in legal copy if intentionally kept; if so, rewrite those too).

- [ ] **Step 2: Run existing tests (if available)**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit test
```

Expected:
- Exit code 0

- [ ] **Step 3: Manual smoke check (dev server)**

Run:

```bash
PORT=3000 pnpm -C /workspace/artifacts/teamspirit dev
```

Check:
- Login, Discover, Host Match, Teams pages show formal Chinese copy

---

## Plan Self-Review

- Spec coverage: only `i18n.tsx` zh strings updated; formal HK Traditional; keeps “你”; excludes mock/user content.
- Placeholder scan: none.
- Type consistency: no key changes, only string value changes.

