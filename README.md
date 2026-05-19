# 登山社團活動許願與報名網站

這是一個部署在 GitHub Pages 的靜態網站，資料透過 Firebase Realtime Database 同步。

## 功能

1. 社員可以新增想去的山。
2. 社員可以新增報名人與想去日期。
3. 管理者輸入密碼 `2738` 後，可以更新剩餘補助款。
4. 補助款會保存更新時間與備註紀錄。
5. 清空許願、報名、補助款紀錄時，需要輸入管理密碼。

## 資料儲存

資料會存到 Firebase Realtime Database。不同電腦、不同手機打開同一個 GitHub Pages 網址，會看到同一份資料。

## 更新網站

修改後重新上傳這些檔案到 GitHub repository：

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

GitHub Pages 通常會在 1 到 3 分鐘後更新。
