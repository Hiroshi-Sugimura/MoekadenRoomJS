# MoekadenRoomJS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.4.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

**MoekadenRoomJS** は、ECHONET Lite対応スマートホーム機器のエミュレータです。開発やテストに最適なツールで、実機がなくてもECHONET Lite対応アプリケーションの動作確認ができます。

もともと [SonyCSL/MoekadenRoom](https://github.com/SonyCSL/MoekadenRoom) のProcessing・Java版があり、本プロジェクトはそのElectron・JavaScript版実装です。ソースコードはスクラッチから作成しているため、互換性を保ちつつも一部挙動が異なる場合があります。

## 特徴

- 🏠 **複数機器のシミュレーション**: エアコン、照明、スマートメーター、温度計、カーテン、電子錠に対応
- 🔌 **ECHONET Lite準拠**: Appendix P, Rev.1 対応
- 💻 **クロスプラットフォーム**: Windows、macOS、Linuxで動作
- 🎮 **GUI操作**: 直感的なUIで機器の状態を変更可能
- 📊 **電力計測機能**: スマートメーターの電力消費データをシミュレーション
- 🌐 **ネットワーク対応**: UDP/IPv4、IPv6に対応

## 対応機器

| 機器 | ECHONET Class | 主な機能 |
|------|--------------|----------|
| エアコン | 0x013001 | 電源ON/OFF、運転モード、温度設定、風量設定 |
| 照明 | 0x029001 | 電源ON/OFF、点灯モード設定 |
| スマートメーター | 0x028801 | 積算電力量、瞬時電力、履歴データ |
| 温度計 | 0x001101 | 温度計測値 |
| カーテン | 0x026001 | 開閉動作設定 |
| 電子錠 | 0x026f01 | 施錠/解錠 |

## インストール

### 必要な環境



### セットアップ

# リポジトリをクローン
git clone https://github.com/Hirosh1912/MoekadenRoomJS.git
cd MoekadenRoomJS/app

# 依存パッケージをインストール
npm install
# アプリケーションを起動
npm start
```

### バイナリ版（v1.4.0以降）

開発環境の構築が不要な実行可能ファイル版を配布しています。electron-forgeによるネイティブパッケージング対応：

- **Windows**: Squirrel + AppX形式
- **macOS**: DMG + ZIP形式
- **Linux**: DEB + RPM形式

**ダウンロード**: [Releases](https://github.com/Hiroshi-Sugimura/MoekadenRoomJS/releases/)

## 使い方

### 基本操作

1. アプリケーションを起動すると、メインウィンドウに仮想的な部屋が表示されます
2. 各機器をクリックして状態を変更できます
3. ECHONET Lite対応アプリケーションから、同一ネットワーク上のデバイスとして認識されます

### ビルド

実行可能ファイルを作成する場合（v1.4.0以降）：

```bash
cd app
npm run make
```

ビルド成果物は `app/out/make/` ディレクトリに生成されます：
- `squirrel.windows/x64/`: Windows インストーラー
- `appx/x64/`: Windows AppXパッケージ
- その他：macOS、Linux対応ファイル


## API・開発者向け情報

### プロジェクト構成

```
MoekadenRoomJS/
├── app/                # v1.4.0以降のメインアプリケーション
│   ├── src/
│   │   ├── main.js           # Electronメインプロセス
│   │   ├── mainEL.js         # ECHONET Lite制御ロジック
│   │   ├── preload.js        # プリロードスクリプト
│   │   ├── public/           # レンダラープロセス（UI）
│   │   │   ├── index.htm
│   │   │   ├── js/
│   │   │   └── css/
│   │   └── icons/            # アプリケーションアイコン
│   ├── appx/                 # Windows AppXマニフェスト
│   ├── forge.config.js       # electron-forge設定
│   └── package.json
├── docs/               # JSDoc自動生成ドキュメント
├── .github/workflows/  # GitHub Actions
└── README.md
```

### 主要な依存パッケージ

- **electron**: v39.2.6 - デスクトップアプリケーションフレームワーク
- **@electron-forge**: v7.10.2 - バイナリパッケージング
- **echonet-lite**: ECHONET Lite通信ライブラリ
- **node-cron**: 定期実行タスク管理
- **date-utils**: 日付・時刻処理

**ライセンス情報**: `npm run license-check` で `src/modules.json` に出力

### ECHONET Liteについて

ECHONET Lite（エコーネットライト）は、家庭やビル内のスマート機器を制御・監視するための通信プロトコルです。日本のスマートホーム・HEMS（Home Energy Management System）で広く採用されています。

**参考リンク**:
- [ECHONET Lite規格書](https://echonet.jp/spec_g/)
- [echonet-lite.js ライブラリ](https://github.com/Hiroshi-Sugimura/echonet-lite.js)


## ドキュメント

### JSDoc API ドキュメント

自動生成されたAPIドキュメント：
**👉 [https://hiroshi-sugimura.github.io/MoekadenRoomJS/](https://hiroshi-sugimura.github.io/MoekadenRoomJS/)**

- **更新タイミング**: main/masterへのpushで自動生成（GitHub Actions）
- **テンプレート**: Docdash
- **対象**: `app/src/` 配下のJavaScript
- **ワークフロー**: [.github/workflows/generate-jsdoc.yml](.github/workflows/generate-jsdoc.yml)

#### ローカル生成

```bash
npm install -g jsdoc docdash
cd app
jsdoc -r src -d ../docs -R ../README.md
```

### バイナリ配布

- **MacOS**: [Releases](https://github.com/Hiroshi-Sugimura?tab=packages&repo_name=MoekadenRoomJS)


## トラブルシューティング

### npm installでGitが必要というエラーが出る

package-lock.jsonを削除してから再度インストール：

```bash
cd app
rm package-lock.json
npm install
```

### アプリが起動しない

1. Node.jsのバージョンを確認（v22以上が必要）
2. `node_modules`を削除して再インストール：
   ```bash
   cd app
   rm -rf node_modules
   npm install
   npm start
   ```

### ライセンス情報の確認

各ライブラリのライセンスを確認：

```bash
cd app
npm run license-check
```

出力ファイル: `app/src/modules.json`

### ネットワーク上で機器が見つからない

- ファイアウォール設定でUDP通信が許可されているか確認してください
- 同一ネットワークセグメントに接続されているか確認してください
- アプリケーションの設定でIPv4/IPv6の設定を確認してください


## 貢献

プルリクエスト、Issue報告を歓迎します！

1. このリポジトリをフォーク
2. Feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成


## ライセンス

MIT License

Copyright (c) Hiroshi SUGIMURA (Kanagawa Institute of Technology, JAPAN)

詳細は [LICENSE](LICENSE) ファイルを参照してください。


## 謝辞

- オリジナルの [MoekadenRoom](https://github.com/SonyCSL/MoekadenRoom) (SonyCSL) に感謝します
- ECHONET Liteプロトコルの開発者およびコミュニティに感謝します


## 関連リンク

- [公式マニュアル](https://hiroshi-sugimura.github.io/MoekadenRoomJS/)
- [JSDoc API ドキュメント](https://hiroshi-sugimura.github.io/MoekadenRoomJS/docs/)
- [ECHONET Lite公式サイト](https://echonet.jp/)
- [echonet-lite.js ライブラリ](https://github.com/Hiroshi-Sugimura/echonet-lite.js)


## お問い合わせ

- **Author**: Hiroshi SUGIMURA
- **Email**: hiroshi.sugimura@gmail.com
- **Institution**: Kanagawa Institute of Technology, JAPAN


---


## 対応オブジェクトとEPCおよびデフォルト値

以下は、本エミュレータが対応するECHONET Liteオブジェクトの詳細仕様です。

### node profile
```json
'0ef001': {
	// super
	"88": [0x42], // Fault status, get
	"8a": [0x00, 0x00, 0x77], // maker code, manufacturer code, kait = 00 00 77, get
	"8b": [0x00, 0x00, 0x02], // business facility code, homeele = 00 00 02, get
	"9d": [0x02, 0x80, 0xd5], // inf map, 1 Byte目は個数, get
	"9e": [0x00],             // set map, 1 Byte目は個数, get
	"9f": [0x0e, 0x80, 0x82, 0x83, 0x88, 0x8a, 0x8b, 0x9d, 0x9e, 0x9f, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7], // get map, 1 Byte目は個数, get
	// detail
	"80": [0x30], // 動作状態, get, inf
	"82": [0x01, 0x0d, 0x01, 0x00], // EL version, 1.13, get
	"83": [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], // identifier, initialize時に、renewNICList()できちんとセットする, get
	"d3": [0x00, 0x00, 0x01],  // 自ノードで保持するインスタンスリストの総数（ノードプロファイル含まない）, initialize時にuser項目から自動計算, get
	"d4": [0x00, 0x02],        // 自ノードクラス数（ノードプロファイル含む）, initialize時にuser項目から自動計算, get
	"d5": [],    // インスタンスリスト通知, 1Byte目はインスタンス数, initialize時にuser項目から自動計算, anno
	"d6": [],    // 自ノードインスタンスリストS, initialize時にuser項目から自動計算, get
	"d7": []     // 自ノードクラスリストS, initialize時にuser項目から自動計算, get
}
```

### device object
```json
'001101': {  // thermometer
	// super
	'80': [0x30], // 動作状態, on, get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, get
	'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
	'9e': [0x01, 0x81],  // set map, 1 Byte目は個数, get
	'9f': [0x0a, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
	// detail
	'e0': [0x00, 0xdc]  // 温度計測値, get
},
'013001': {  // aircon
	// super
	'80': [0x31], // 動作状態, set?, get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, ,get
	'9d': [0x05, 0x80, 0x81, 0x8f, 0xb0, 0xa0],  // inf map, 1 Byte目は個数, get
	'9e': [0x06, 0x80, 0x81, 0x8f, 0xb0, 0xb3, 0xa0],  // set map, 1 Byte目は個数, get
	'9f': [0x0d, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f, 0xb0, 0xb3, 0xbb], // get map, 1 Byte目は個数, get
	// detail
	'8f': [0x42], // 節電動作設定, set, get, inf
	'b0': [0x42], // 運転モード設定, set, get, inf
	'b3': [0x1a], // 温度設定, set, get
	'bb': [0x14], // 室内温度計測値, get
	'a0': [0x41]  // 風量設定, set, get, inf
},
'026001': {  // blind = curtain, 日よけ
	// super
	'80': [0x30], // 動作状態, on,  get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, get
	'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
	'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
	'9f': [0x0a, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
	// detail
	'e0': [0x41]  // 開閉動作設定, set, get, inf
},
'026f01': {  // electnic lock
	// super
	'80': [0x30], // 動作状態, on, get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, get
	'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
	'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
	'9f': [0x0a, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
	// detail
	'e0': [0x41]  // 施錠設定１, set, get, inf
},
'028801': {  // smart meter
	// super
	'80': [0x30], // 動作状態, on, get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, get
	'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
	'9e': [0x02, 0x81, 0xa5],  // set map, 1 Byte目は個数, get
	'9f': [0x12, 65, 65, 65, 33, 0, 64, 0, 96, 65, 0, 65, 0, 0, 0, 2, 2, 2], // get map, 1 Byte目は個数, 記述形式2, get
	// detail
	'd3': [0x00, 0x00, 0x00, 0x01],  // 係数, Get
	'd7': [0x08],  // 積算電力量有効桁数, get
	'e0': [0x02],  // 積算電力量計測値（正）, get
	'e1': [0x02],  // 積算電力量単位（正）, 0x02 = 0x01kWh, get
	'e2': [], // 積算電力量計測値履歴１（正）, get
	'e5': [0x00], // 積算履歴収集日１, set, get
	'e7': [0x10], // 瞬時電力計測値, get
	'e8': [0x00, 0x10, 0x00, 0x00], // 瞬時電力計測値, get
	'ea': []  // 定時積算電力量計測値, get
},
'029001': {  // lighting
	// super
	'80': [0x31], // 動作状態, set?, get, inf
	'81': [0x0f], // 設置場所, set, get, inf
	'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
	'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03], // identifier, initialize時に、renewNICList()できちんとセットする, get
	'88': [0x42], // 異常状態, 0x42 = 異常無, get
	'8a': [0x00, 0x00, 0x77],  // maker code, kait, get
	'9d': [0x04, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
	'9e': [0x04, 0x80, 0x81, 0xb6],  // set map, 1 Byte目は個数, get
	'9f': [0x0a, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x9d, 0x9e, 0x9f, 0xb6], // get map, 1 Byte目は個数, get
	// uniq
	'b6': [0x42] // 点灯モード設定, set, get
}
```


## サポートされるEPCプロパティの説明

### 共通プロパティ（全機器）

| EPC | プロパティ名 | 説明 |
|-----|-------------|------|
| 0x80 | 動作状態 | ON(0x30) / OFF(0x31) |
| 0x81 | 設置場所 | 機器の設置場所コード |
| 0x82 | 規格Version情報 | ECHONET Lite規格のバージョン |
| 0x83 | 識別番号 | 機器固有の識別番号 |
| 0x88 | 異常発生状態 | 異常あり(0x41) / 異常なし(0x42) |
| 0x8a | メーカーコード | 製造メーカー識別コード（本エミュは0x000077 = KAIT） |

### エアコン固有プロパティ (0x013001)

| EPC | プロパティ名 | 説明 |
|-----|-------------|------|
| 0x8f | 節電動作設定 | 節電動作中(0x41) / 通常動作(0x42) |
| 0xb0 | 運転モード設定 | 自動(0x41)、冷房(0x42)、暖房(0x43)、除湿(0x44)、送風(0x45) |
| 0xb3 | 温度設定値 | 設定温度（℃） |
| 0xbb | 室内温度計測値 | 現在の室温（℃） |
| 0xa0 | 風量設定 | 自動(0x41)～8段階(0x31-0x38) |

### スマートメーター固有プロパティ (0x028801)

| EPC | プロパティ名 | 説明 |
|-----|-------------|------|
| 0xd3 | 係数 | 積算電力量の係数 |
| 0xd7 | 積算電力量有効桁数 | 有効桁数 |
| 0xe0 | 積算電力量計測値（正方向） | 累積使用電力量 |
| 0xe1 | 積算電力量単位 | 単位（0.1kWh、1kWh等） |
| 0xe7 | 瞬時電力計測値 | 現在の消費電力（W） |
| 0xea | 定時積算電力量計測値 | 定時の積算電力量 |


## Module licenses

using LicenseChecker.js

本プロジェクトは多くのオープンソースライブラリに依存しています。各ライブラリのライセンスについては、[Modules.json](app/src/modules.json) のバックアップファイルを参照してください。

主要な依存ライブラリ：
- Electron (MIT License)
- echonet-lite.js (MIT License)
- node-cron (ISC License)
- その他多数（詳細はバックアップファイル参照）


## 変更履歴

### v1.4.0 (2026)
- 🔄 Electron 39 + electron-forge 7.10 で再パッケージ（Squirrel, AppX, DMG, DEB, RPM）
- 🪪 AppX Publisher/Identity 修正と署名付きビルド整備
- 🔒 fuses 導入でセキュリティ強化（ContextIsolation など）
- 📁 プロジェクトを `app/` 配下へ整理し、JSDoc 対象を `app/src` に更新
- 📚 公開ドキュメント: https://hiroshi-sugimura.github.io/MoekadenRoomJS/
- 📜 ライセンス出力: `npm run license-check` → `app/src/modules.json`

### v1.3.0 (2024)
- ✨ 消費電力計測機能対応
- 📊 スマートメーターの電力履歴データ保存機能追加
- 🐛 バグ修正とパフォーマンス改善

### v1.2.0 (2024)
- ✨ 複数のSet、Getプロパティに対応
- 🔧 ECHONET Lite通信の安定性向上
- 📝 ドキュメント改善

### v1.1.0 (2023)
- ✨ ECHONET Lite Appendix P, Rev.1 対応
- 🎮 EPCプロパティの追加実装
- 🌐 IPv6対応強化

### v1.0.0 (2022)
- 🎉 初回リリース
- 🏠 基本的な6種類の機器エミュレーション実装
- 💻 Electron GUI実装
- 🔌 ECHONET Lite基本機能実装
