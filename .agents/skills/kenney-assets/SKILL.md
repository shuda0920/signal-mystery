---
name: kenney-assets
description: 透過 Kenney All-in-1 預覽目錄搜尋遊戲素材，提供英文、繁體中文、用途與預覽連結。用於本專案挑選 Kenney 圖像、介面、圖示、音效或模型。
---

# Kenney 素材搜尋

此 skill 放在本專案，供目前的專案工作使用，不需安裝到使用者全域 skills。

## 來源與索引

- 指定入口：https://kenney.nl/data/itch/preview/
- [完整中英素材表](references/catalog.md)：依原站分類整理的全部素材包，含每項預覽連結。
- [可搜尋索引](references/catalog.json)：英文名稱、繁中譯名、用途摘要、分類、預覽 URL，以及擷取日期。
- 官網個別素材入口：https://kenney.nl/assets
- All-in-1 合集說明：https://kenney.itch.io/kenney-game-assets

## 找素材

依需求辨認主題、2D／3D、視角與畫風，先搜尋索引，再開啟候選預覽確認。相同主題優先挑選同系列，避免混用像素、向量、等角與俯視素材。

從專案根目錄執行（Python 標準函式庫，無額外套件）：

```powershell
python .agents/skills/kenney-assets/scripts/catalog.py --query "農場 farm" --category 2D
python .agents/skills/kenney-assets/scripts/catalog.py --query "介面 音效" --category Audio
python .agents/skills/kenney-assets/scripts/catalog.py --category UI
python .agents/skills/kenney-assets/scripts/catalog.py --refresh
```

查詢以空白分開的詞做 OR 比對，搜尋英文、繁中與用途。`--refresh` 重新讀取指定入口、更新兩份索引並保留已有翻譯；新項目標為待翻譯，應補上繁中名稱與摘要。離線索引可協助篩選，但推薦前應核對即時網頁；無法連線時明確提供快照日期，不宣稱已確認最新內容。

回覆以「英文名稱、繁體中文、分類、用途與適合原因、預覽連結」呈現。完整清單讀取 catalog.md；一般需求只提供最符合的候選。中文為整理譯名，用途摘要是依名稱及分類推定的選材方向，不是官方逐項規格。

## 確認可用性

- 原目錄的連結是預覽 PNG，不是素材壓縮檔。到官網搜尋同名素材並核對下載頁；找不到時標示未確認，不猜測檔名、下載 URL 或以預覽圖代替正式素材。
- All-in-1 是整包付費下載入口；個別素材可到官網查找。確認實際下載頁及包內 License，不把可看預覽當成已取得素材檔。
- 預覽頁明示可能漏列部分包。只稱索引包含「預覽頁列出的包」，不要聲稱涵蓋 Kenney 所有素材。
- Phaser 4 專案優先考慮 2D、UI、Icons、Audio。3D 模型需要其他渲染整合或預先轉成 2D 圖像，不能直接當作一般 Phaser Sprite 載入。Construct 範例也不是 Phaser 程式。
- 3D 包也可能附帶可直接使用的 2D 渲染圖：先檢查 `Isometric/`、`Side/` 等目錄。本專案已下載 Nature Kit 2.1，內含正式單張 PNG；來源、雜湊與已選用檔案記錄於專案 `docs/asset-sources.json`。避免重複下載本地已有的包。
- 尺寸、單張圖／spritesheet／atlas、動畫幀數、音訊編碼、透明背景與字型字元涵蓋，需讀取實際檔案或官方明細後才可確認。中文遊戲尤其要確認字型支援繁中。
- 只要求選材時完成選材；使用者要求整合時，再下載其選用的正式素材至專案資產目錄，保留來源與授權，並依實際格式選用 Phaser Loader。不要下載整站或執行購買。
