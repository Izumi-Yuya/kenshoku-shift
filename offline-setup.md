# オフライン対応版セットアップ

インターネット接続なしでも動作するバージョンを作成する手順です。

## 必要なファイルをダウンロード

以下のファイルをダウンロードして、プロジェクトフォルダに保存：

### 1. React関連
```
https://unpkg.com/react@18/umd/react.development.js
→ libs/react.development.js

https://unpkg.com/react-dom@18/umd/react-dom.development.js  
→ libs/react-dom.development.js

https://unpkg.com/@babel/standalone/babel.min.js
→ libs/babel.min.js
```

### 2. Tailwind CSS
```
https://cdn.tailwindcss.com
→ libs/tailwind.css
```

## フォルダ構成
```
kenshoku-shift/
├── index.html
├── index-offline.html  # オフライン版
├── libs/
│   ├── react.development.js
│   ├── react-dom.development.js
│   ├── babel.min.js
│   └── tailwind.css
└── README.md
```

## 使用方法

1. **オンライン版**: `index.html` を使用
2. **オフライン版**: `index-offline.html` を使用

オフライン版は一度ダウンロードすれば、インターネット接続なしで動作します。