# O'right 圖片編輯器 (Image Editor)

上傳圖片並加上品牌標記的線上工具，支援中文／English 介面切換。

## 功能

### O'right | PRO 浮水印
- 上傳圖片後自動在底部加上 O'right | PRO 浮水印
- 可調整底色、透明度、底部高度、LOGO 大小

### USDA 標章
- 上傳圖片後加上 USDA 標章
- 可調整標章顏色（白、灰）、大小、位置（左上、右上、左下、右下）

### 其他
- RWD 響應式介面（手機設定為底部抽屜）
- 偵測 LINE 內建瀏覽器：提示以外部瀏覽器開啟（`openExternalBrowser=1`），下載改為「長按儲存」彈窗
- 滑桿調整使用 requestAnimationFrame 繪圖 + 延遲 PNG 編碼，拖動不卡頓

## 開發

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 產出 dist/
npm run lint     # TypeScript 型別檢查
```

## 專案結構

```
src/
  App.tsx                      # Header、nav 分頁、語言切換、LINE 提示
  i18n.ts                      # 中英文字串
  utils.ts                     # LINE 偵測、下載
  hooks/useCanvasPreview.ts    # 流暢的 canvas 預覽管線
  components/
    EditorLayout.tsx           # 桌面側欄 + 手機抽屜共用骨架
    UploadZone.tsx             # 拖放上傳區
    PreviewPane.tsx            # 預覽、下載、LINE 長按儲存彈窗
    WatermarkEditor.tsx        # PRO 浮水印編輯頁
    UsdaEditor.tsx             # USDA 標章編輯頁
public/
  logo.png                     # O'right | PRO 浮水印
  usda-white.png               # 官方 USDA Certified Biobased Product 標章（白）
  usda-gray.png                # 官方 USDA Certified Biobased Product 標章（灰）
```
