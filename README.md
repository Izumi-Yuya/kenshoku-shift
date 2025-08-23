# 介護施設向け検食シフト作成システム

介護施設での検食ローテーションを効率的に管理するWebアプリケーションです。

## 機能

- 🍽️ 検食ローテーション自動割当
- 👥 スタッフ管理（介護・ナース・事務）
- 📊 CSV出力機能
- 💾 ローカル保存・読込機能
- ⚙️ 柔軟な設定変更

## 使い方

1. **オンラインで使用**: https://izumi-yuya.github.io/kenshoku-shift/
2. **ローカルでの使用**: `index.html` をブラウザで開く

## オンライン版の特徴

- インターネット接続があればどこからでもアクセス可能
- スマートフォン・タブレットでも利用可能
- 最新版が常に利用可能
- データはブラウザのローカルストレージに保存

## ローカル開発

```bash
# ファイルをダウンロード
git clone https://github.com/Izumi-Yuya/kenshoku-shift.git
cd kenshoku-shift

# ブラウザで開く
open index.html  # macOS
start index.html # Windows
```

## 技術仕様

- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel (CDN)
- Pure HTML/JavaScript（サーバー不要）

## ライセンス

MIT License