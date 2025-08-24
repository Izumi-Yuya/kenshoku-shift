# 介護施設向け検食シフト作成システム

介護施設での勤務シフトと検食ローテーションを効率的に管理するWebアプリケーションです。

## 主な機能

### 🔄 自動割当機能
- ✨ 勤務シフト自動割当
- 🍽️ 検食ローテーション自動割当
- 📋 スタッフの制約条件を考慮した最適化

### 👥 スタッフ管理
- 看護師・介護士・相談員の管理
- 個別の制約設定（検食不可・シフト不可）
- アクティブ/非アクティブ状態管理
- メモ機能

### 💾 データ管理
- **設定データCSV**: スタッフ情報・シフト要件・検食設定
- **完全データCSV**: 設定+シフト+検食の全データ
- **出力用CSV**: シフト表・検食表・スタッフ別勤務表
- ファイルベースでの安全なデータ管理

### 📊 出力機能
- 勤務シフト表
- 検食ローテーション表
- スタッフ別勤務表
- 設定データのバックアップ

## 使い方

1. **オンラインで使用**: https://izumi-yuya.github.io/kenshoku-shift/
2. **ローカルでの使用**: `index.html` をブラウザで開く

## オンライン版の特徴

- インターネット接続があればどこからでもアクセス可能
- スマートフォン・タブレットでも利用可能
- 最新版が常に利用可能
- CSVファイルでのデータ管理（ブラウザ非依存）
- 施設間でのデータ共有が容易

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

- **フロントエンド**: React 18 (CDN)
- **スタイリング**: Tailwind CSS (CDN)
- **トランスパイラ**: Babel (CDN)
- **アーキテクチャ**: Pure HTML/JavaScript（サーバー不要）
- **データ形式**: CSV（Excel互換）
- **モジュール構成**: ES6モジュール化されたJavaScript

## プロジェクト構造

```
kenshoku-shift/
├── index.html              # メインアプリケーション
├── js/
│   ├── utils.js            # ユーティリティ関数
│   ├── constants.js        # 定数・初期設定
│   ├── schedule.js         # スケジュール管理
│   ├── autoAssign.js       # 自動割当機能
│   ├── csv.js              # CSV出力機能
│   ├── storage.js          # データ保存・読込
│   └── components.js       # Reactコンポーネント
├── manifest.json           # PWA設定
├── 404.html               # エラーページ
├── netlify.toml           # Netlify設定
├── offline-setup.md       # オフライン版手順
└── README.md              # プロジェクト説明
```

## ライセンス

MIT License