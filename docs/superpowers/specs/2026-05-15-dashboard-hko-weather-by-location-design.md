# Dashboard：天文台即時天氣（用家定位）設計稿

## 背景

Dashboard 已經會在前端使用 `navigator.geolocation`（透過 `getUserLocation()`）取得用家定位（lat/lng），目前主要用於附近公開場距離排序與顯示（[dashboard.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.tsx)）。

用家希望 Dashboard 顯示「跟用家定位」的香港天文台即時天氣資訊，並可追蹤更新。

## 目標（Goals）

- 在 Dashboard 顯示：
  - 附近即時溫度（選取最接近用家定位的溫度測站）
  - 濕度（HKO rhrread 提供全港濕度）
  - 近一小時雨量（以地區 rain gauge / district rainfall mapping）
  - 天氣警告/雷暴（HKO `warningMessage`）
- 更新頻率：每 10 分鐘（前端 refetchInterval + 後端 cache TTL）。
- 不直接由前端 call HKO（避免 CORS / 數據格式耦合 / 未來可加 cache、可控錯誤處理）。

## 非目標（Non-goals）

- 不做 9 日預報 / 雷達圖 / 風向風速（本期不做）。
- 不做背景位置追蹤（只在 Dashboard 當下取得定位）。
- 不要求 100% 精準到街道；以「最近測站/最近地區」作合理近似。

## 資料來源

使用香港天文台 Open Data `rhrread`（Current Weather Report）。

- `tc`：`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`
- `en`：`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en`

回傳包含：
- `temperature.data[]`（多個測站，含 place/value）
- `humidity.data[]`（全港濕度）
- `rainfall.data[]`（各區雨量，含 startTime/endTime）
- `warningMessage[]`（雷暴/暴雨等提示）

## 架構（Architecture）

### 前端

- Dashboard 在取得定位成功後，呼叫後端 `/api/weather/nearby`：
  - Query params：`lat`, `lng`, `lang`（來自 `useI18n().lang`）
- 使用 React Query：
  - `refetchInterval = 10 * 60 * 1000`
  - `retry = 1`（沿用全域設定）
- 若用家拒絕定位：
  - Dashboard 不顯示定位天氣卡；顯示一個簡短提示（可選：顯示「允許定位以查看附近天氣」）。

### 後端（api-server）

新增 endpoint：

- `GET /api/weather/nearby?lat=22.3&lng=114.2&lang=tc|en`

後端責任：
- 驗證 query 參數（lat/lng 必須為有限數字）
- call HKO `rhrread`（依 lang）
- 計算：
  - **最近溫度測站**：在 `temperature.data[]` 中選出距離 (lat/lng) 最近的 station（需要 station → 坐標 mapping）
  - **濕度**：取 `humidity.data[0]`（或 place==="Hong Kong Observatory"）
  - **雨量**：從 `rainfall.data[]` 中找與「用家所在區」最接近/相符的 rainfall item（district mapping）
  - **warning**：回傳 `warningMessage[]`
- cache：
  - 以 `lang` 作 key（因 HKO 內容受 lang 影響）
  - TTL 10 分鐘
  - 不以 user lat/lng 作 cache key（因 HKO 原始資料全港同一份；只是在 server 端做最近測站計算，成本低）

## Station / District Mapping

HKO `rhrread` 的 `temperature.data[].place` 係 station name（例如 `"Kwun Tong"` / `"觀塘"`），但未含坐標。

本期方案：
- 在後端維護一個最小 station 坐標表（只需覆蓋 HKO 常見 stations；缺失時 fallback 到 `"Hong Kong Observatory"` / `"香港天文台"`）。
- District 雨量：
  - rhrread rainfall 已提供 18 區（en/tc 名稱一致），可用 detectDistrict / districtTranslations 的既有 mapping 做配對
  - 若無法匹配，fallback 到 `rainfall.data` 的 `main==="TRUE"` 或第一項

## 回傳格式（Backend → Frontend）

```ts
type NearbyWeather = {
  fetchedAt: string;        // server time
  lang: "tc" | "en";
  location: { lat: number; lng: number };

  temperature: {
    station: string;        // station place
    value: number;
    unit: string;           // "C"
    recordTime: string;
    distanceKm?: number;    // optional
  };

  humidity?: {
    value: number;
    unit: string;           // percent
    recordTime: string;
  };

  rainfall?: {
    district: string;       // district place
    max: number;
    min?: number;
    unit: string;           // "mm"
    startTime: string;
    endTime: string;
  };

  warnings: string[];       // warningMessage
  icon?: number[];          // optional HKO icon code
  iconUpdateTime?: string;
  updateTime?: string;      // HKO updateTime
};
```

## UI（Dashboard）

新增一張 Card（建議位置：welcome header 下、AI Recommendation 上或下）：
- 標題：`附近天氣` / `Nearby Weather`
- 顯示：
  - `xx°C`（station）
  - `濕度 xx%`
  - `近一小時雨量 x mm（{district}）`
  - 若有 warning：以 Badge/Alert block 顯示第一條（可展開顯示全部）
- 右上角顯示 `更新時間`（HKO updateTime）

## 錯誤處理

- HKO fetch 失敗：
  - 後端回 502 `{ error: "HKO fetch failed" }`
  - 前端顯示灰色 fallback（例如「暫時未能取得天氣資料」）並保持其他 Dashboard 功能正常
- lat/lng 無效：
  - 後端回 400
- 用家拒絕定位：
  - 前端不呼叫 weather endpoint

## 測試策略

- 後端：
  - unit test/簡易 script 測 `GET /weather/nearby`（mock HKO response）
  - cache 行為（同一 lang 10 分鐘內只 fetch 一次）
- 前端：
  - Dashboard 測試：mock `getUserLocation()` 成功/失敗、mock api 回傳 weather，驗證 UI render

## 驗收準則（Acceptance Criteria）

- Dashboard 在允許定位時會顯示「附近天氣」卡。
- 每 10 分鐘自動更新一次（或重新進頁更新）。
- 顯示溫度、濕度、雨量、警告訊息（如有）。
- 定位拒絕或 HKO 失敗不會令 Dashboard crash。

