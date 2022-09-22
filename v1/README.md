# MoekadenRoomJS
Electron版

- 準備は src以下で npm i
- ソースの実行は src以下で npm start
- buildは src以下で npm run make


## 対応オブジェクトとEPCおよびデフォルト値

- node profile
```node-profile:JSON
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
- device object
```
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



## Module licenses

using LicenseChecker.js

- "@electron/get@1.14.1","MIT","https://github.com/electron/get"
- "@gar/promisify@1.1.3","MIT","https://github.com/wraithgar/gar-promisify"
- "@malept/cross-spawn-promise@2.0.0","Apache-2.0","https://github.com/malept/cross-spawn-promise"
- "@npmcli/fs@2.1.2","ISC","https://github.com/npm/fs"
- "@npmcli/move-file@2.0.1","MIT","https://github.com/npm/move-file"
- "@sindresorhus/is@0.14.0","MIT","https://github.com/sindresorhus/is"
- "@sindresorhus/is@4.6.0","MIT","https://github.com/sindresorhus/is"
- "@szmarczak/http-timer@1.1.2","MIT","https://github.com/szmarczak/http-timer"
- "@szmarczak/http-timer@4.0.6","MIT","https://github.com/szmarczak/http-timer"
- "@tootallnate/once@2.0.0","MIT","https://github.com/TooTallNate/once"
- "@types/cacheable-request@6.0.2","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/http-cache-semantics@4.0.1","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/json-buffer@3.0.0","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/keyv@3.1.4","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/node@16.11.56","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/responselike@1.0.0","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "@types/yauzl@2.10.0","MIT","https://github.com/DefinitelyTyped/DefinitelyTyped"
- "abbrev@1.1.1","ISC","https://github.com/isaacs/abbrev-js"
- "accessibility-developer-tools@2.12.0","Apache-2.0","https://github.com/GoogleChrome/accessibility-developer-tools"
- "agent-base@6.0.2","MIT","https://github.com/TooTallNate/node-agent-base"
- "agentkeepalive@4.2.1","MIT","https://github.com/node-modules/agentkeepalive"
- "aggregate-error@3.1.0","MIT","https://github.com/sindresorhus/aggregate-error"
- "ajv-formats@2.1.1","MIT","https://github.com/ajv-validator/ajv-formats"
- "ajv@8.11.0","MIT","https://github.com/ajv-validator/ajv"
- "ansi-regex@5.0.1","MIT","https://github.com/chalk/ansi-regex"
- "ansi-styles@4.3.0","MIT","https://github.com/chalk/ansi-styles"
- "aproba@2.0.0","ISC","https://github.com/iarna/aproba"
- "are-we-there-yet@3.0.1","ISC","https://github.com/npm/are-we-there-yet"
- "atomically@1.7.0","MIT","https://github.com/fabiospampinato/atomically"
- "balanced-match@1.0.2","MIT","https://github.com/juliangruber/balanced-match"
- "base64-js@1.5.1","MIT","https://github.com/beatgammit/base64-js"
- "bl@4.1.0","MIT","https://github.com/rvagg/bl"
- "boolean@3.2.0","MIT","https://github.com/thenativeweb/boolean"
- "brace-expansion@1.1.11","MIT","https://github.com/juliangruber/brace-expansion"
- "brace-expansion@2.0.1","MIT","https://github.com/juliangruber/brace-expansion"
- "buffer-crc32@0.2.13","MIT","https://github.com/brianloveswords/buffer-crc32"
- "buffer@5.7.1","MIT","https://github.com/feross/buffer"
- "cacache@16.1.3","ISC","https://github.com/npm/cacache"
- "cacheable-lookup@5.0.4","MIT","https://github.com/szmarczak/cacheable-lookup"
- "cacheable-request@6.1.0","MIT","https://github.com/lukechilds/cacheable-request"
- "cacheable-request@7.0.2","MIT","https://github.com/lukechilds/cacheable-request"
- "chalk@4.1.2","MIT","https://github.com/chalk/chalk"
- "chownr@2.0.0","ISC","https://github.com/isaacs/chownr"
- "clean-stack@2.2.0","MIT","https://github.com/sindresorhus/clean-stack"
- "cli-cursor@3.1.0","MIT","https://github.com/sindresorhus/cli-cursor"
- "cli-spinners@2.7.0","MIT","https://github.com/sindresorhus/cli-spinners"
- "cliui@7.0.4","ISC","https://github.com/yargs/cliui"
- "clone-response@1.0.3","MIT","https://github.com/sindresorhus/clone-response"
- "clone@1.0.4","MIT","https://github.com/pvorb/node-clone"
- "color-convert@2.0.1","MIT","https://github.com/Qix-/color-convert"
- "color-name@1.1.4","MIT","https://github.com/colorjs/color-name"
- "color-support@1.1.3","ISC","https://github.com/isaacs/color-support"
- "compress-brotli@1.3.8","MIT","https://github.com/Kikobeats/compress-brotli"
- "concat-map@0.0.1","MIT","https://github.com/substack/node-concat-map"
- "conf@10.2.0","MIT","https://github.com/sindresorhus/conf"
- "config-chain@1.1.13","MIT","https://github.com/dominictarr/config-chain"
- "console-control-strings@1.1.0","ISC","https://github.com/iarna/console-control-strings"
- "cross-spawn@7.0.3","MIT","https://github.com/moxystudio/node-cross-spawn"
- "date-utils@1.2.21","MIT","https://github.com/JerrySievert/date-utils"
- "debounce-fn@4.0.0","MIT","https://github.com/sindresorhus/debounce-fn"
- "debug@4.3.4","MIT","https://github.com/debug-js/debug"
- "decompress-response@3.3.0","MIT","https://github.com/sindresorhus/decompress-response"
- "decompress-response@6.0.0","MIT","https://github.com/sindresorhus/decompress-response"
- "defaults@1.0.3","MIT","https://github.com/tmpvar/defaults"
- "defer-to-connect@1.1.3","MIT","https://github.com/szmarczak/defer-to-connect"
- "defer-to-connect@2.0.1","MIT","https://github.com/szmarczak/defer-to-connect"
- "define-properties@1.1.4","MIT","https://github.com/ljharb/define-properties"
- "delegates@1.0.0","MIT","https://github.com/visionmedia/node-delegates"
- "depd@1.1.2","MIT","https://github.com/dougwilson/nodejs-depd"
- "detect-libc@2.0.1","Apache-2.0","https://github.com/lovell/detect-libc"
- "detect-node@2.1.0","MIT","https://github.com/iliakan/detect-node"
- "devtron@1.4.0","MIT","https://github.com/electron/devtron"
- "dot-prop@6.0.1","MIT","https://github.com/sindresorhus/dot-prop"
- "duplexer3@0.1.5","BSD-3-Clause","https://github.com/sindresorhus/duplexer3"
- "echonet-lite@2.7.1","MIT","https://github.com/Hiroshi-Sugimura/echonet-lite.js"
- "electron-log@4.4.8","MIT","https://github.com/megahertz/electron-log"
- "electron-rebuild@3.2.9","MIT","https://github.com/electron/electron-rebuild"
- "electron-store@8.1.0","MIT","https://github.com/sindresorhus/electron-store"
- "electron@20.1.1","MIT","https://github.com/electron/electron"
- "emoji-regex@8.0.0","MIT","https://github.com/mathiasbynens/emoji-regex"
- "encodeurl@1.0.2","MIT","https://github.com/pillarjs/encodeurl"
- "encoding@0.1.13","MIT","https://github.com/andris9/encoding"
- "end-of-stream@1.4.4","MIT","https://github.com/mafintosh/end-of-stream"
- "env-paths@2.2.1","MIT","https://github.com/sindresorhus/env-paths"
- "err-code@2.0.3","MIT","https://github.com/IndigoUnited/js-err-code"
- "es6-error@4.1.1","MIT","https://github.com/bjyoungblood/es6-error"
- "escalade@3.1.1","MIT","https://github.com/lukeed/escalade"
- "escape-string-regexp@4.0.0","MIT","https://github.com/sindresorhus/escape-string-regexp"
- "extract-zip@2.0.1","BSD-2-Clause","https://github.com/maxogden/extract-zip"
- "fast-deep-equal@3.1.3","MIT","https://github.com/epoberezkin/fast-deep-equal"
- "fd-slicer@1.1.0","MIT","https://github.com/andrewrk/node-fd-slicer"
- "find-up@3.0.0","MIT","https://github.com/sindresorhus/find-up"
- "fs-extra@10.1.0","MIT","https://github.com/jprichardson/node-fs-extra"
- "fs-extra@8.1.0","MIT","https://github.com/jprichardson/node-fs-extra"
- "fs-minipass@2.1.0","ISC","https://github.com/npm/fs-minipass"
- "fs.realpath@1.0.0","ISC","https://github.com/isaacs/fs.realpath"
- "function-bind@1.1.1","MIT","https://github.com/Raynos/function-bind"
- "gauge@4.0.4","ISC","https://github.com/npm/gauge"
- "get-caller-file@2.0.5","ISC","https://github.com/stefanpenner/get-caller-file"
- "get-intrinsic@1.1.2","MIT","https://github.com/ljharb/get-intrinsic"
- "get-stream@4.1.0","MIT","https://github.com/sindresorhus/get-stream"
- "get-stream@5.2.0","MIT","https://github.com/sindresorhus/get-stream"
- "glob@7.2.3","ISC","https://github.com/isaacs/node-glob"
- "glob@8.0.3","ISC","https://github.com/isaacs/node-glob"
- "global-agent@3.0.0","BSD-3-Clause","https://github.com/gajus/global-agent"
- "global-tunnel-ng@2.7.1","BSD-3-Clause","https://github.com/np-maintain/global-tunnel"
- "globalthis@1.0.3","MIT","https://github.com/ljharb/System.global"
- "got@11.8.5","MIT","https://github.com/sindresorhus/got"
- "got@9.6.0","MIT","https://github.com/sindresorhus/got"
- "graceful-fs@4.2.10","ISC","https://github.com/isaacs/node-graceful-fs"
- "has-flag@4.0.0","MIT","https://github.com/sindresorhus/has-flag"
- "has-property-descriptors@1.0.0","MIT","https://github.com/inspect-js/has-property-descriptors"
- "has-symbols@1.0.3","MIT","https://github.com/inspect-js/has-symbols"
- "has-unicode@2.0.1","ISC","https://github.com/iarna/has-unicode"
- "has@1.0.3","MIT","https://github.com/tarruda/has"
- "highlight.js@9.18.5","BSD-3-Clause","https://github.com/highlightjs/highlight.js"
- "http-cache-semantics@4.1.0","BSD-2-Clause","https://github.com/kornelski/http-cache-semantics"
- "http-proxy-agent@5.0.0","MIT","https://github.com/TooTallNate/node-http-proxy-agent"
- "http2-wrapper@1.0.3","MIT","https://github.com/szmarczak/http2-wrapper"
- "https-proxy-agent@5.0.1","MIT","https://github.com/TooTallNate/node-https-proxy-agent"
- "humanize-ms@1.2.1","MIT","https://github.com/node-modules/humanize-ms"
- "humanize-plus@1.8.2","MIT","https://github.com/HubSpot/humanize"
- "iconv-lite@0.6.3","MIT","https://github.com/ashtuchkin/iconv-lite"
- "ieee754@1.2.1","BSD-3-Clause","https://github.com/feross/ieee754"
- "imurmurhash@0.1.4","MIT","https://github.com/jensyt/imurmurhash-js"
- "indent-string@4.0.0","MIT","https://github.com/sindresorhus/indent-string"
- "infer-owner@1.0.4","ISC","https://github.com/npm/infer-owner"
- "inflight@1.0.6","ISC","https://github.com/npm/inflight"
- "inherits@2.0.4","ISC","https://github.com/isaacs/inherits"
- "ini@1.3.8","ISC","https://github.com/isaacs/ini"
- "ip@2.0.0","MIT","https://github.com/indutny/node-ip"
- "is-fullwidth-code-point@3.0.0","MIT","https://github.com/sindresorhus/is-fullwidth-code-point"
- "is-interactive@1.0.0","MIT","https://github.com/sindresorhus/is-interactive"
- "is-lambda@1.0.1","MIT","https://github.com/watson/is-lambda"
- "is-obj@2.0.0","MIT","https://github.com/sindresorhus/is-obj"
- "is-unicode-supported@0.1.0","MIT","https://github.com/sindresorhus/is-unicode-supported"
- "isexe@2.0.0","ISC","https://github.com/isaacs/isexe"
- "json-buffer@3.0.0","MIT","https://github.com/dominictarr/json-buffer"
- "json-buffer@3.0.1","MIT","https://github.com/dominictarr/json-buffer"
- "json-schema-traverse@1.0.0","MIT","https://github.com/epoberezkin/json-schema-traverse"
- "json-schema-typed@7.0.3","BSD-2-Clause","https://github.com/typeslick/json-schema-typed"
- "json-stringify-safe@5.0.1","ISC","https://github.com/isaacs/json-stringify-safe"
- "jsonfile@4.0.0","MIT","https://github.com/jprichardson/node-jsonfile"
- "jsonfile@6.1.0","MIT","https://github.com/jprichardson/node-jsonfile"
- "keyv@3.1.0","MIT","https://github.com/lukechilds/keyv"
- "keyv@4.4.1","MIT","https://github.com/jaredwray/keyv"
- "locate-path@3.0.0","MIT","https://github.com/sindresorhus/locate-path"
- "lodash@4.17.21","MIT","https://github.com/lodash/lodash"
- "log-symbols@4.1.0","MIT","https://github.com/sindresorhus/log-symbols"
- "lowercase-keys@1.0.1","MIT","https://github.com/sindresorhus/lowercase-keys"
- "lowercase-keys@2.0.0","MIT","https://github.com/sindresorhus/lowercase-keys"
- "lru-cache@6.0.0","ISC","https://github.com/isaacs/node-lru-cache"
- "lru-cache@7.14.0","ISC","https://github.com/isaacs/node-lru-cache"
- "lzma-native@8.0.6","MIT","https://github.com/addaleax/lzma-native"
- "make-fetch-happen@10.2.1","ISC","https://github.com/npm/make-fetch-happen"
- "matcher@3.0.0","MIT","https://github.com/sindresorhus/matcher"
- "mimic-fn@2.1.0","MIT","https://github.com/sindresorhus/mimic-fn"
- "mimic-fn@3.1.0","MIT","https://github.com/sindresorhus/mimic-fn"
- "mimic-response@1.0.1","MIT","https://github.com/sindresorhus/mimic-response"
- "mimic-response@3.1.0","MIT","https://github.com/sindresorhus/mimic-response"
- "minimatch@3.1.2","ISC","https://github.com/isaacs/minimatch"
- "minimatch@5.1.0","ISC","https://github.com/isaacs/minimatch"
- "minipass-collect@1.0.2","ISC",""
- "minipass-fetch@2.1.2","MIT","https://github.com/npm/minipass-fetch"
- "minipass-flush@1.0.5","ISC","https://github.com/isaacs/minipass-flush"
- "minipass-pipeline@1.2.4","ISC",""
- "minipass-sized@1.0.3","ISC","https://github.com/isaacs/minipass-sized"
- "minipass@3.3.4","ISC","https://github.com/isaacs/minipass"
- "minizlib@2.1.2","MIT","https://github.com/isaacs/minizlib"
- "mkdirp@1.0.4","MIT","https://github.com/isaacs/node-mkdirp"
- "ms@2.1.2","MIT","https://github.com/zeit/ms"
- "negotiator@0.6.3","MIT","https://github.com/jshttp/negotiator"
- "node-abi@3.24.0","MIT","https://github.com/lgeiger/node-abi"
- "node-addon-api@3.2.1","MIT","https://github.com/nodejs/node-addon-api"
- "node-api-version@0.1.4","MIT","https://github.com/timfish/node-api-version"
- "node-cron@3.0.2","ISC","https://github.com/merencia/node-cron"
- "node-gyp-build@4.5.0","MIT","https://github.com/prebuild/node-gyp-build"
- "node-gyp@9.1.0","MIT","https://github.com/nodejs/node-gyp"
- "nopt@5.0.0","ISC","https://github.com/npm/nopt"
- "normalize-url@4.5.1","MIT","https://github.com/sindresorhus/normalize-url"
- "normalize-url@6.1.0","MIT","https://github.com/sindresorhus/normalize-url"
- "npm-conf@1.1.3","MIT","https://github.com/kevva/npm-conf"
- "npmlog@6.0.2","ISC","https://github.com/npm/npmlog"
- "object-keys@1.1.1","MIT","https://github.com/ljharb/object-keys"
- "once@1.4.0","ISC","https://github.com/isaacs/once"
- "onetime@5.1.2","MIT","https://github.com/sindresorhus/onetime"
- "ora@5.4.1","MIT","https://github.com/sindresorhus/ora"
- "p-cancelable@1.1.0","MIT","https://github.com/sindresorhus/p-cancelable"
- "p-cancelable@2.1.1","MIT","https://github.com/sindresorhus/p-cancelable"
- "p-limit@2.3.0","MIT","https://github.com/sindresorhus/p-limit"
- "p-locate@3.0.0","MIT","https://github.com/sindresorhus/p-locate"
- "p-map@4.0.0","MIT","https://github.com/sindresorhus/p-map"
- "p-try@2.2.0","MIT","https://github.com/sindresorhus/p-try"
- "path-exists@3.0.0","MIT","https://github.com/sindresorhus/path-exists"
- "path-is-absolute@1.0.1","MIT","https://github.com/sindresorhus/path-is-absolute"
- "path-key@3.1.1","MIT","https://github.com/sindresorhus/path-key"
- "pend@1.2.0","MIT","https://github.com/andrewrk/node-pend"
- "pify@3.0.0","MIT","https://github.com/sindresorhus/pify"
- "pkg-up@3.1.0","MIT","https://github.com/sindresorhus/pkg-up"
- "prepend-http@2.0.0","MIT","https://github.com/sindresorhus/prepend-http"
- "progress@2.0.3","MIT","https://github.com/visionmedia/node-progress"
- "promise-inflight@1.0.1","ISC","https://github.com/iarna/promise-inflight"
- "promise-retry@2.0.1","MIT","https://github.com/IndigoUnited/node-promise-retry"
- "proto-list@1.2.4","ISC","https://github.com/isaacs/proto-list"
- "pump@3.0.0","MIT","https://github.com/mafintosh/pump"
- "punycode@2.1.1","MIT","https://github.com/bestiejs/punycode.js"
- "quick-lru@5.1.1","MIT","https://github.com/sindresorhus/quick-lru"
- "readable-stream@3.6.0","MIT","https://github.com/nodejs/readable-stream"
- "require-directory@2.1.1","MIT","https://github.com/troygoode/node-require-directory"
- "require-from-string@2.0.2","MIT","https://github.com/floatdrop/require-from-string"
- "resolve-alpn@1.2.1","MIT","https://github.com/szmarczak/resolve-alpn"
- "responselike@1.0.2","MIT","https://github.com/lukechilds/responselike"
- "responselike@2.0.1","MIT","https://github.com/sindresorhus/responselike"
- "restore-cursor@3.1.0","MIT","https://github.com/sindresorhus/restore-cursor"
- "retry@0.12.0","MIT","https://github.com/tim-kos/node-retry"
- "rimraf@3.0.2","ISC","https://github.com/isaacs/rimraf"
- "roarr@2.15.4","BSD-3-Clause","https://github.com/gajus/roarr"
- "safe-buffer@5.2.1","MIT","https://github.com/feross/safe-buffer"
- "safer-buffer@2.1.2","MIT","https://github.com/ChALkeR/safer-buffer"
- "semver-compare@1.0.0","MIT","https://github.com/substack/semver-compare"
- "semver@6.3.0","ISC","https://github.com/npm/node-semver"
- "semver@7.3.7","ISC","https://github.com/npm/node-semver"
- "serialize-error@7.0.1","MIT","https://github.com/sindresorhus/serialize-error"
- "set-blocking@2.0.0","ISC","https://github.com/yargs/set-blocking"
- "shebang-command@2.0.0","MIT","https://github.com/kevva/shebang-command"
- "shebang-regex@3.0.0","MIT","https://github.com/sindresorhus/shebang-regex"
- "signal-exit@3.0.7","ISC","https://github.com/tapjs/signal-exit"
- "smart-buffer@4.2.0","MIT","https://github.com/JoshGlazebrook/smart-buffer"
- "socks-proxy-agent@7.0.0","MIT","https://github.com/TooTallNate/node-socks-proxy-agent"
- "socks@2.7.0","MIT","https://github.com/JoshGlazebrook/socks"
- "sprintf-js@1.1.2","BSD-3-Clause","https://github.com/alexei/sprintf.js"
- "ssri@9.0.1","ISC","https://github.com/npm/ssri"
- "string-width@4.2.3","MIT","https://github.com/sindresorhus/string-width"
- "string_decoder@1.3.0","MIT","https://github.com/nodejs/string_decoder"
- "strip-ansi@6.0.1","MIT","https://github.com/chalk/strip-ansi"
- "sumchecker@3.0.1","Apache-2.0","https://github.com/malept/sumchecker"
- "supports-color@7.2.0","MIT","https://github.com/chalk/supports-color"
- "tar@6.1.11","ISC","https://github.com/npm/node-tar"
- "to-readable-stream@1.0.0","MIT","https://github.com/sindresorhus/to-readable-stream"
- "tunnel@0.0.6","MIT","https://github.com/koichik/node-tunnel"
- "type-fest@0.13.1","(MIT OR CC0-1.0)","https://github.com/sindresorhus/type-fest"
- "type-fest@2.19.0","(MIT OR CC0-1.0)","https://github.com/sindresorhus/type-fest"
- "unique-filename@2.0.1","ISC","https://github.com/npm/unique-filename"
- "unique-slug@3.0.0","ISC","https://github.com/npm/unique-slug"
- "universalify@0.1.2","MIT","https://github.com/RyanZim/universalify"
- "universalify@2.0.0","MIT","https://github.com/RyanZim/universalify"
- "uri-js@4.4.1","BSD-2-Clause","https://github.com/garycourt/uri-js"
- "url-parse-lax@3.0.0","MIT","https://github.com/sindresorhus/url-parse-lax"
- "util-deprecate@1.0.2","MIT","https://github.com/TooTallNate/util-deprecate"
- "uuid@8.3.2","MIT","https://github.com/uuidjs/uuid"
- "wcwidth@1.0.1","MIT","https://github.com/timoxley/wcwidth"
- "which@2.0.2","ISC","https://github.com/isaacs/node-which"
- "wide-align@1.1.5","ISC","https://github.com/iarna/wide-align"
- "wrap-ansi@7.0.0","MIT","https://github.com/chalk/wrap-ansi"
- "wrappy@1.0.2","ISC","https://github.com/npm/wrappy"
- "y18n@5.0.8","ISC","https://github.com/yargs/y18n"
- "yallist@4.0.0","ISC","https://github.com/isaacs/yallist"
- "yargs-parser@21.1.1","ISC","https://github.com/yargs/yargs-parser"
- "yargs@17.5.1","MIT","https://github.com/yargs/yargs"
- "yauzl@2.10.0","MIT","https://github.com/thejoshwolfe/yauzl"


## 変更履歴

- 1.2.0 複数のSet、Getに対応
- 1.1.0 release P, rev.1 に対応するためにEPC増やしていく
- 1.0.0 公開

