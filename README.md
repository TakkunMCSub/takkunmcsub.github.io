# Utility Tools

ブラウザだけで使える、無料のオンラインユーティリティ集です。GitHub Pagesなどの静的ホスティングで動作します。

## 公開サイト

https://utility.takkunlego0916.f5.si/

## ツール一覧

| ツール | 内容 | URL |
| --- | --- | --- |
| UUIDジェネレーター | UUID v1 / v4 / v7、GUIDの生成 | `/tools/?tool=uuid` |
| パスワード生成 | 暗号学的乱数を使ったパスワード作成 | `/tools/?tool=password` |
| テキスト整形 | 文字数確認、空白整理、重複削除、並べ替え | `/tools/?tool=text` |
| JSON整形・検証 | JSONの構文検証、整形、圧縮 | `/tools/?tool=json` |
| Base64変換 | UTF-8対応のエンコード・デコード | `/tools/?tool=base64` |
| URLエンコード | URL変換と構成要素の解析 | `/tools/?tool=url` |
| タイムスタンプ変換 | Unix時間と日時の相互変換 | `/tools/?tool=timestamp` |
| カラーコード変換 | HEX / RGB / HSLの相互変換 | `/tools/?tool=color` |
| 正規表現テスター | 一致確認、キャプチャ、置換 | `/tools/?tool=regex` |
| ハッシュ生成 | SHA-1 / SHA-256 / SHA-384 / SHA-512 | `/tools/?tool=hash` |
| CSSグラデーション | linear-gradientのプレビューとCSS生成 | `/tools/?tool=gradient` |
| データ容量変換 | B / KB / MB / GB / TBなどの換算 | `/tools/?tool=bytes` |
| ランダム抽選 | 候補抽選とリストのシャッフル | `/tools/?tool=random` |
| 文章・コードの特徴分析 | 文体・反復・コード構造の簡易分析 | `/ai-checker/` |

## 開発

このプロジェクトはHTML / CSS / JavaScriptで構成されています。ビルド工程やサーバーサイド処理は必要ありません。

```text
Utility Tools/
├── assets/
│   ├── site.css
│   ├── site.js
│   ├── tools.css
│   └── tools.js
├── tools/
│   ├── index.html
│   └── regex-worker.js
├── ai-checker/
├── uuidgen/
├── passwordgen/
├── passgen/
├── index.html
├── README.md
└── CHANGELOG.md
```

## 旧URLとの互換性

従来の `/uuidgen/`、`/passwordgen/`、`/passgen/` は、新しいツール画面へ自動転送します。

## プライバシー

各ツールは原則としてブラウザ内で処理します。外部APIへの送信は行いません。ハッシュ生成にはWeb Crypto APIを使用するため、HTTPS環境での利用を推奨します。

文章・コードの特徴分析は簡易的なルールに基づく参考情報です。AI生成物かどうかを正確に判定するものではありません。

## ライセンス

MIT License
