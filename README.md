# MoekadenRoomJS

もともと https://github.com/SonyCSL/MoekadenRoom (SonyCSL)のProcessing、Java版があり、そのElectron、JavaScript版になります。
ソースコードはスクラッチから作っていますので、互換性があるように作っていますが、ところどころ挙動は異なります。


# manual

https://hiroshi-sugimura.github.io/MoekadenRoomJS/


# Binary

- Win, Mac: https://www.sugi-lab.net/


# Documentation

- JSDoc: main/masterへのpush時にGitHub Actionsで自動生成されるよ（テンプレはDocdash）。
- 出力先: リポジトリ直下の`docs/`。`v1`配下のJavaScriptを再帰で対象にしてる。
- ワークフロー: [.github/workflows/generate-jsdoc.yml](.github/workflows/generate-jsdoc.yml)
- ローカルで試すなら（任意）:
	- `npm install -g jsdoc`
	- `npm install -g docdash`
	- `jsdoc -r v1 -d docs -R README.md -t $(npm root -g)/docdash`
