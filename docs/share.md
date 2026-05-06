# 試玩模式上線（免費）

## Windows 一鍵分享

1. 安裝 Cloudflare Tunnel（cloudflared）

```powershell
winget install -e --id Cloudflare.cloudflared
```

2. 於 repo root 執行

```powershell
pnpm install
pnpm share
```

3. 將 terminal 印出嘅 `https://*.trycloudflare.com` URL 發俾朋友即可使用

## 注意

- 你部機要保持開住（API + 前端 + tunnel）
- 圖片上傳會寫入 `artifacts/api-server/uploads/`

