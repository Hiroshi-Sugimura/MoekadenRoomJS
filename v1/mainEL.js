//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.09.05 (MIT License)
//	Based on OWADA Shigeru 2020.12.24 (MIT License)
//////////////////////////////////////////////////////////////////////
'use strict'

//////////////////////////////////////////////////////////////////////
// 基本ライブラリ
const fs   = require('fs');
const path = require('path');
const EL = require('echonet-lite');
const cron = require('node-cron');

// 基礎設定
const appDir     = process.env.NODE_ENV === 'development' ? __dirname : __dirname;

//////////////////////////////////////////////////////////////////////
// ExportするObj
let mainEL = {
	objList: [],
	elsocket: null,
	recv_callback: null,
	config: { },
	measureTask: null,

	// スマートメーター履歴データ
	cumLog: [],  // 30分単位での積算電力量ログ
	lastLogUpdateTime: Date.now(),
	SMART_METER_LOG_START_DAY: 2,  // 何日前の0:00からログ取得を開始したかを示す。0なら今日。
	MAX_CUMENERGY_PER_HALF_HOUR: 0.1,  // 30分間の最大消費電力量（kWh）

	devState: {
		'001101': {  // thermometer
			// super
			'80': [0x30], // 動作状態, on, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'84': [0x00, 0x02],  // 瞬時消費電力計測値, unsigned short
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x54, 0x68, 0x65, 0x72, 0x6d, 0x6f, 0x00, 0x00, 0x00],  // 商品コード (MoeThermo)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
			'9e': [0x01, 0x81],  // set map, 1 Byte目は個数, get
			'9f': [0x0f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
			// uniq
			'e0': [0x00, 0xdc]  // 温度計測値, get
		},
		'013001': {  // aircon
			// super
			'80': [0x31], // 動作状態, set?, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'84': [0x00, 0x02],  // 瞬時消費電力計測値, unsigned short
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, ,get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x41, 0x69, 0x72, 0x63, 0x6f, 0x6e, 0x00, 0x00, 0x00],  // 商品コード (MoeAircon)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x05, 0x80, 0x81, 0x8f, 0xb0, 0xa0],  // inf map, 1 Byte目は個数, get
			'9e': [0x06, 0x80, 0x81, 0x8f, 0xb0, 0xb3, 0xa0],  // set map, 1 Byte目は個数, get
			'9f': [0x13, 13,  1,  1,  9,  1,  0,  0,  0,  1,  0,  1,  9,  1,  3,  3,  3], // get map, 1 Byte目は個数, 記述形式2, get
			// uniq
			'8f': [0x42], // 節電動作設定, set, get, inf
			'a0': [0x41],  // 風量設定, set, get, inf
			'b0': [0x42], // 運転モード設定, set, get, inf
			'b3': [0x1a], // 温度設定, set, get
			'bb': [0x14] // 室内温度計測値, get
		},
		'026001': {  // blind = curtain, 日よけ
			// super
			'80': [0x30], // 動作状態, on,  get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'84': [0x00, 0x03],  // 瞬時消費電力計測値, unsigned short
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x43, 0x75, 0x72, 0x74, 0x61, 0x69, 0x6e, 0x00, 0x00],  // 商品コード (MoeCurtain)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
			'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
			'9f': [0x0f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
			// uniq
			'e0': [0x41]  // 開閉動作設定, set, get, inf
		},
		'026f01': {  // electnic lock
			// super
			'80': [0x30], // 動作状態, on, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'84': [0x00, 0x01],  // 瞬時消費電力計測値, unsigned short
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x4c, 0x6f, 0x63, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x00],  // 商品コード (MoeLock)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
			'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
			'9f': [0x0f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
			// uniq
			'e0': [0x41]  // 施錠設定１, set, get, inf
		},
		'028801': {  // smart meter
			// super
			'80': [0x30], // 動作状態, on, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x45, 0x4d, 0x65, 0x74, 0x65, 0x72, 0x00, 0x00, 0x00],  // 商品コード (MoeEMeter)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
			'9e': [0x02, 0x81, 0xa5],  // set map, 1 Byte目は個数, get
			// '9f': [0x12, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x9d, 0x9e, 0x9f, 0xd3, 0xd7, 0xe0, 0xe1, 0xe2, 0xe5, 0xe7, 0xe8, 0xea], // get map, 1 Byte目は個数, 記述形式1はprop16まで, get
			'9f': [0x15, 65, 65, 65, 33,  0, 64,  0, 96, 65,  0, 65,  1,  1,  3,  3,  2], // get map, 1 Byte目は個数, 記述形式2, get
			// uniq
			'd3': [0x00, 0x00, 0x00, 0x01],  // 係数, Get
			'd7': [0x08],  // 積算電力量有効桁数, get
			'e0': [0x02],  // 積算電力量計測値（正）, get
			'e1': [0x02],  // 積算電力量単位（正）, 0x02 = 0.01kWh, get
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
			'84': [0x00, 0x01],  // 瞬時消費電力計測値, unsigned short
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x4c, 0x69, 0x67, 0x68, 0x74, 0x69, 0x6e, 0x67, 0x00],  // 商品コード (MoeLighting)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
			'9e': [0x03, 0x80, 0x81, 0xb6],  // set map, 1 Byte目は個数, get
			'9f': [0x0f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xb6], // get map, 1 Byte目は個数, get
			// uniq
			'b6': [0x42] // 点灯モード設定, set, get
		}
	},



	//////////////////////////////////////////////////////////////////////
	// 内部
	// EL受け取った後の処理
	ELreceived: function( rinfo, els, error ) {
		if( error ) {
			console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() error:', error);
			console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() rinfo:', rinfo);
			console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() els:', els);
			throw error;
		}

		// mainEL.config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() rinfo:', rinfo, '\nels:', els ):0;

		// EL controller
		switch( els.ESV ) {
			case '60':  // SET_I
			case '61':  // SET_C
			switch( els.DEOJ.substr(0,4) ) {
				case '0130':  // エアコン
				mainEL.setAircon( rinfo, els );
				break;

				case '0290':  // ライト
				mainEL.setLight( rinfo, els );
				break;

				case '0260':  // カーテン
				mainEL.setCurtain( rinfo, els );
				break;

				case '026f':  // 鍵
				mainEL.setLock( rinfo, els );
				break;

				case '0011':  // 温度計
				mainEL.setThermometer( rinfo, els );
				break;

				case '0288':  // スマメ
				mainEL.setSmartmeter( rinfo, els );
				break;
			}
			break;

			case '62':  // GET
			switch( els.DEOJ.substr(0,4) ) {
				case '0130':  // エアコン
				mainEL.getAircon( rinfo, els );
				break;

				case '0290':  // ライト
				mainEL.getLight( rinfo, els );
				break;

				case '0260':  // カーテン
				mainEL.getCurtain( rinfo, els );
				break;

				case '026f':  // 鍵
				mainEL.getLock( rinfo, els );
				break;

				case '0011':  // 温度計
				mainEL.getThermometer( rinfo, els );
				break;

				case '0288':  // スマメ
				mainEL.getSmartmeter( rinfo, els );
				break;
			}
			break;
		}

		mainEL.recv_callback(rinfo, els, error);
	},

	//////////////////////////////////////////////////////////////////////
	// ELの処理開始
	start: async function( _config, receive_cb, change_cb ) {
		mainEL.config = _config;
		mainEL.objList = ['013001', '029001', '026001', '026f01', '001101', '028801'];
		mainEL.recv_callback = receive_cb;

		// ECHONET Lite socket
		mainEL.elsocket = await EL.initialize( mainEL.objList, mainEL.ELreceived, 0, mainEL.config);

		// 各機器の識別番号をmac addressを利用したNode_profileを参照して更新
		mainEL.devState['013001']['83'][7]  = mainEL.devState['029001']['83'][7]  = mainEL.devState['026001']['83'][7]  = mainEL.devState['026f01']['83'][7]  = mainEL.devState['001101']['83'][7]  = mainEL.devState['028801']['83'][7]  = EL.Node_details["83"][7];
		mainEL.devState['013001']['83'][8]  = mainEL.devState['029001']['83'][8]  = mainEL.devState['026001']['83'][8]  = mainEL.devState['026f01']['83'][8]  = mainEL.devState['001101']['83'][8]  = mainEL.devState['028801']['83'][8]  = EL.Node_details["83"][8];
		mainEL.devState['013001']['83'][9]  = mainEL.devState['029001']['83'][9]  = mainEL.devState['026001']['83'][9]  = mainEL.devState['026f01']['83'][9]  = mainEL.devState['001101']['83'][9]  = mainEL.devState['028801']['83'][9]  = EL.Node_details["83"][9];
		mainEL.devState['013001']['83'][10] = mainEL.devState['029001']['83'][10] = mainEL.devState['026001']['83'][10] = mainEL.devState['026f01']['83'][10] = mainEL.devState['001101']['83'][10] = mainEL.devState['028801']['83'][10] = EL.Node_details["83"][10];
		mainEL.devState['013001']['83'][11] = mainEL.devState['029001']['83'][11] = mainEL.devState['026001']['83'][11] = mainEL.devState['026f01']['83'][11] = mainEL.devState['001101']['83'][11] = mainEL.devState['028801']['83'][11] = EL.Node_details["83"][11];
		mainEL.devState['013001']['83'][12] = mainEL.devState['029001']['83'][12] = mainEL.devState['026001']['83'][12] = mainEL.devState['026f01']['83'][12] = mainEL.devState['001101']['83'][12] = mainEL.devState['028801']['83'][12] = EL.Node_details["83"][12];

		mainEL.beginMeasureElectricEnergy();

	},


	//////////////////////////////////////////////////////////////////////
	// 各デバイスの処理開始

	// 文字列0をつなげて，後ろから2文字分スライスする
	Byte2HexString: function (byte) {
		return (("0" + byte.toString(16)).slice(-2));
	},

	// 消費電力取得
	getInstantaneousPower: function (eoj) {
		let array = mainEL.devState[eoj]['84'];
		let ret = array[0] * 256 + array[1];
		return ret;
	},

	setInstantaneousPower: function( u16 ) {
		let array = [ u16/256, u16%256];
		return array;
	},

	// 消費電力のバーチャル計測
	beginMeasureElectricEnergy: function () {
		// 初期化：スマートメーター履歴データの初期化
		mainEL.initializeSmartMeterLog();

		mainEL.measureTask = cron.schedule( '*/1 * * * *', () => {
			// 瞬時電力計測値
			let instantaneousPower = 0;
			instantaneousPower += mainEL.getInstantaneousPower('001101');  // 温度計
			instantaneousPower += mainEL.getInstantaneousPower('013001');  // エアコン
			instantaneousPower += mainEL.getInstantaneousPower('026001');  // ブラインド
			instantaneousPower += mainEL.getInstantaneousPower('026f01');  // 電子錠
			instantaneousPower += mainEL.getInstantaneousPower('029001');  // ライト
			instantaneousPower *= 100;  // 0.01kW単位なので100倍する
			mainEL.devState['028801']['e7'] = mainEL.setInstantaneousPower(instantaneousPower);

			// スマートメーター履歴データの更新
			mainEL.updateSmartMeterLog();
		});
	},

	endMeasureElectricEnegy: function () {
		mainEL.measureTask.stop();
	},

	//////////////////////////////////////////////////////////////////////
	// スマートメーター履歴データ管理

	// 履歴データの初期化
	initializeSmartMeterLog: function() {
		const loglen = (mainEL.SMART_METER_LOG_START_DAY + 1) * 48;  // 1日48スロット（30分間隔）
		mainEL.cumLog = [];
		mainEL.cumLog[0] = 0;

		// ランダムな電力量ログを生成
		for (let i = 1; i < loglen; i++) {
			mainEL.cumLog[i] = mainEL.cumLog[i - 1] + Math.random() * mainEL.MAX_CUMENERGY_PER_HALF_HOUR;
		}
		mainEL.lastLogUpdateTime = Date.now();
	},

	// 現在の30分スロットインデックスを取得
	getLatestIndexHalfHour: function() {
		const now = new Date();
		const hour = now.getHours();
		const min = now.getMinutes();
		return hour * 2 + (min < 30 ? 0 : 1);
	},

	// 指定された日時のスロットの積算電力量を取得
	getCumulativeEnergy: function(day, indexHalfHour) {
		const latestHalfHour = mainEL.getLatestIndexHalfHour();
		const loglen = mainEL.cumLog.length;

		if (loglen === 0) {
			mainEL.initializeSmartMeterLog();
		}

		// 未来のデータ
		if (day === 0 && indexHalfHour > latestHalfHour) {
			return -1;
		}

		const storedDays = Math.floor(mainEL.cumLog.length / 48);
		// ログ取得開始前
		if (day >= storedDays) {
			return -1;
		}

		return mainEL.cumLog[(storedDays - day - 1) * 48 + indexHalfHour];
	},

	// スマートメーター履歴データの定期更新
	updateSmartMeterLog: function() {
		const now = Date.now();
		const latestHalfHour = mainEL.getLatestIndexHalfHour();
		const prevLatestHalfHour = mainEL.prevAccessLatestHalfHour || latestHalfHour;

		// 30分ごとにスロットを更新
		if (latestHalfHour !== prevLatestHalfHour && latestHalfHour === 0) {
			// 新しい日付になった場合、ログを拡張
			const newData = mainEL.cumLog[mainEL.cumLog.length - 1];
			for (let i = 0; i < 48; i++) {
				mainEL.cumLog.push(newData + Math.random() * mainEL.MAX_CUMENERGY_PER_HALF_HOUR);
			}
		}

		mainEL.prevAccessLatestHalfHour = latestHalfHour;

		// e2：履歴データの更新
		mainEL.updateHistoricalData();
		// ea：最新の定時積算電力量の更新
		mainEL.updateLatestFixedTimeMeasurement();
	},

	// EPC e2 履歴データの更新
	updateHistoricalData: function() {
		const day = mainEL.devState['028801']['e5'] ? mainEL.devState['028801']['e5'][0] : 0;
		const loglen = mainEL.cumLog.length;
		const storedDays = Math.floor(loglen / 48);

		// 履歴データ配列を構築
		const histData = [];
		histData.push(0);  // 積算履歴収集日（上位バイト）
		histData.push(day);  // 積算履歴収集日（下位バイト）

		// 24時間48コマ分のデータ
		for (let si = 0; si < 48; si++) {
			const energy = mainEL.getCumulativeEnergy(day, si);
			const energyValue = energy >= 0 ? Math.floor(energy * 100) : 0xFFFFFFFE;  // 0.01kWh単位

			// 4バイトのビッグエンディアン形式で格納
			histData.push((energyValue >> 24) & 0xFF);
			histData.push((energyValue >> 16) & 0xFF);
			histData.push((energyValue >> 8) & 0xFF);
			histData.push(energyValue & 0xFF);
		}

		mainEL.devState['028801']['e2'] = histData;
	},

	// EPC ea 最新の定時積算電力量の更新
	updateLatestFixedTimeMeasurement: function() {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const date = now.getDate();
		const hour = now.getHours();
		const min = now.getMinutes();
		const sec = now.getSeconds();

		const latestHalfHourIndex = mainEL.getLatestIndexHalfHour();

		// 計測年月日（4バイト）
		const eaData = [];
		eaData.push((year >> 8) & 0xFF);
		eaData.push(year & 0xFF);
		eaData.push(month & 0xFF);
		eaData.push(date & 0xFF);

		// 計測時刻（3バイト）
		eaData.push(hour & 0xFF);
		eaData.push(min < 30 ? 0 : 30);
		eaData.push(0);  // 秒は常に0

		// 積算電力量（4バイト）
		const energy = mainEL.getCumulativeEnergy(0, latestHalfHourIndex);
		const energyValue = energy >= 0 ? Math.floor(energy * 100) : 0xFFFFFFFE;  // 0.01kWh単位

		eaData.push((energyValue >> 24) & 0xFF);
		eaData.push((energyValue >> 16) & 0xFF);
		eaData.push((energyValue >> 8) & 0xFF);
		eaData.push(energyValue & 0xFF);

		mainEL.devState['028801']['ea'] = eaData;
	},



	//----------------------------------------------------------------
	// エアコン
	getAirconSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['013001'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getAircon: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['013001'][epc] );

			if( await mainEL.getAirconSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['013001'][epc].length );
				retDetails.push( mainEL.devState['013001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['013001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.log( 'send:', arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	setAirconSub: function(rinfo, els, epc, edt) {
		switch (epc) { // 持ってるEPCのとき
			// super
			case '80':  // 動作状態, set?, get, inf
			// console.log( 'setAirconSub case:', epc, edt);
			if( edt == '30' || edt == '31' ) {
				mainEL.devState['013001'][epc] = [parseInt(edt, 16)];
				// console.log( 'setAirconSub edt:', edt, mainEL.devState['013001'][epc]);
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
			}else{
				return false;
			}
			break;

			case '81':  // 設置場所, set, get, inf
			mainEL.devState['013001'][epc] = [parseInt(edt, 16)];
			EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
			return true;
			break;

			// detail
			case '8f': // 節電動作設定, set, get, inf
			if( edt == '41' || edt == '42' ) {
				mainEL.devState['013001'][epc] = [parseInt(edt, 16)];
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
			}else{
				return false;
			}
			break;

			case 'b0': // 運転モード設定, set, get, inf
			switch( edt ) {
				case '40': // その他
				case '41': // 自動
				case '42': // 冷房
				case '43': // 暖房
				case '44': // 除湿
				case '45': // 送風
				mainEL.devState['013001'][epc] = [parseInt(edt, 16)];
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
				break;

				default:
				return false;
			}
			break;

			case 'b3': // 温度設定, set, get
			let temp = parseInt( edt, 16 );
			if( -1 < temp && temp < 51 ) {
				mainEL.devState['013001'][epc] = [temp];
				return true;
			}else{
				return false;
			}
			break;

			case 'a0': // 風量設定, set, get, inf
			switch( edt ) {
				case '31': // 0x31..0x38の8段階
				case '32': // 0x31..0x38の8段階
				case '33': // 0x31..0x38の8段階
				case '34': // 0x31..0x38の8段階
				case '35': // 0x31..0x38の8段階
				case '36': // 0x31..0x38の8段階
				case '37': // 0x31..0x38の8段階
				case '38': // 0x31..0x38の8段階
				case '41': // 自動
				mainEL.devState['013001'][epc] = [parseInt(edt, 16)];
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
				break;
				default:
				// EDTがおかしい
				return false;
			}
			break;

			default: // 持っていないEPCやset不可能のとき, SNA
			return false;
		}
	},

	// OPC複数の場合に対応
	setAircon: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['013001'][epc] );

			if( await mainEL.setAirconSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['013001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['013001'][epc].length );
				retDetails.push( mainEL.devState['013001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['013001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x71: 0x51;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	//----------------------------------------------------------------
	// ライト
	getLightSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['029001'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getLight: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['029001'][epc] );

			if( await mainEL.getLightSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['029001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['029001'][epc].length );
				retDetails.push( mainEL.devState['029001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['029001'][epc] );
				retDetails[epc] = [0x00];
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	setLightSub: function(rinfo, els, epc, edt) {
		switch (epc) { // 持ってるEPCのとき
			// super
			case '80':  // 動作状態, set, get, inf
			// console.log( 'setLightSub case:', epc, edt);
			if( edt == '30' || edt == '31' ) {
				mainEL.devState['029001'][epc] = [parseInt(edt, 16)];
				// console.log( 'setLightSub edt:', edt, mainEL.devState['029001'][epc]);
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
			}else{
				return false;
			}
			break;
			case '81':  // 設置場所, set, get, inf
			mainEL.devState['026001'][epc] = [parseInt(edt, 16)];
			EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
			return true;
			break;

			// detail
			case 'b6':  // 点灯モード設定, set, get
			switch( edt ) {
				case '41': // 自動
				case '42': // 通常灯
				case '43': // 常夜灯
				case '45': // カラー灯
				mainEL.devState['026001'][epc] = [parseInt(edt, 16)];
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
				break;
				default: // EDTがおかしい
				return false;
			}

			mainEL.devState['026001'][epc] = [parseInt(edt, 16)];
			return true;
			break;

			default: // 持っていないEPCやset不可能のとき, SNA
			return false;
		}
	},

	// OPC複数の場合に対応
	setLight: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['029001'][epc] );

			if( await mainEL.setLightSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['029001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['029001'][epc].length );
				retDetails.push( mainEL.devState['029001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['029001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x71: 0x51;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	//----------------------------------------------------------------
	// 鍵
	getLockSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['026f01'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getLock: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['026f01'][epc] );

			if( await mainEL.getLockSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['026f01'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['026f01'][epc].length );
				retDetails.push( mainEL.devState['026f01'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['026f01'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	// 個別EPC
	setLockSub: function(rinfo, els, epc, edt) {
		switch (epc) { // 持ってるEPCのとき
			// super
			case '81':  // 設置場所, set, get, inf
			mainEL.devState['026f01'][epc] = [parseInt(edt, 16)];
			EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
			return true;
			break;

			// detail
			case 'e0':  // 施錠状態, set, get, inf
			// console.log( 'setLightSub case:', epc, edt);
			if( edt == '41' || edt == '42' ) {
				mainEL.devState['026f01'][epc] = [parseInt(edt, 16)];
				// console.log( 'setLightSub edt:', edt, mainEL.devState['026f01'][epc]);
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
			}else{
				return false;
			}
			break;


			default: // 持っていないEPCやset不可能のとき, SNA
			return false;
		}
	},

	// OPC複数の場合に対応
	setLock: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['026f01'][epc] );

			if( await mainEL.setLockSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['026f01'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['026f01'][epc].length );
				retDetails.push( mainEL.devState['026f01'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['026f01'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x71: 0x51;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},


	//----------------------------------------------------------------
	// カーテン
	getCurtainSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['026001'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getCurtain: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['026001'][epc] );

			if( await mainEL.getCurtainSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['026001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['026001'][epc].length );
				retDetails.push( mainEL.devState['026001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['026001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	// 個別EPC
	setCurtainSub: function(rinfo, els, epc, edt) {
		switch (epc) { // 持ってるEPCのとき
			// super
			case '81':  // 設置場所, set, get, inf
			mainEL.devState['026001'][epc] = [parseInt(edt, 16)];
			EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
			return true;
			break;

			// detail
			case 'e0':  // 開閉動作設定, set, get, inf
			// console.log( 'setLightSub case:', epc, edt);
			if( edt == '41' || edt == '42' ) {
				mainEL.devState['026001'][epc] = [parseInt(edt, 16)];
				// console.log( 'setLightSub edt:', edt, mainEL.devState['026f01'][epc]);
				EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
				return true;
			}else{
				return false;
			}
			break;


			default: // 持っていないEPCやset不可能のとき, SNA
			return false;
		}
	},

	// OPC複数の場合に対応
	setCurtain: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['026001'][epc] );

			if( await mainEL.setCurtainSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['026001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['026001'][epc].length );
				retDetails.push( mainEL.devState['026001'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['026001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x71: 0x51;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},


	//----------------------------------------------------------------
	// スマメ
	getSmartmeterSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['028801'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getSmartmeter: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['028801'][epc] );

			if( await mainEL.getSmartmeterSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['028801'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['028801'][epc].length );
				retDetails.push( mainEL.devState['028801'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['028801'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	setSmartmeter: function(rinfo, els) {
		for (let epc in els.DETAILs) {
			if (mainEL.devState['028801'][epc]) { // 持ってるEPCのとき
				// e5（積算履歴収集日）のセット時は特別処理
				if (epc === 'e5') {
					mainEL.devState['028801'][epc] = els.DETAILs[epc];
					// 履歴データを更新
					mainEL.updateHistoricalData();
					EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SET_RES, EL.toHexArray(epc), mainEL.devState['028801'][epc]);
				} else {
					mainEL.devState['028801'][epc] = els.DETAILs[epc];
					EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SET_RES, EL.toHexArray(epc), mainEL.devState['028801'][epc]);
				}
			} else { // 持っていないEPCのとき, SNA
				if( els.ESV == EL.SETC ) {
					EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
				}else{
					EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
				}
			}
		}
	},


	//----------------------------------------------------------------
	// 温度計
	getThermometerSub: function(rinfo, els, epc, edt) {
		if (mainEL.devState['001101'][epc]) { // 持ってるEPCのとき
			return true;
		}else{
			return false;
		}
	},

	// OPC複数の場合に対応
	getThermometer: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['013001'][epc] );

			if( await mainEL.getThermometerSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['001101'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['001101'][epc].length );
				retDetails.push( mainEL.devState['001101'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['013001'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x72: 0x52;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

	// 個別EPC
	setThermometerSub: function(rinfo, els, epc, edt) {
		switch (epc) { // 持ってるEPCのとき
			// super
			case '81':  // 設置場所, set, get, inf
			mainEL.devState['001101'][epc] = [parseInt(edt, 16)];
			EL.sendOPC1( EL.EL_Multi, EL.toHexArray(els.DEOJ), [0x05, 0xff, 0x01], EL.INF, EL.toHexArray(epc), [parseInt(edt, 16)] );  // INF
			return true;
			break;

			// detail


			default: // 持っていないEPCやset不可能のとき, SNA
			return false;
		}
	},

	// OPC複数の場合に対応
	setThermometer: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['001101'][epc] );

			if( await mainEL.setThermometerSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['001101'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['001101'][epc].length );
				retDetails.push( mainEL.devState['001101'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['001101'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( 0x00 );
				success = false;
			}
			ret_opc += 1;
		}

		let ret_esv = success? 0x71: 0x51;  // 一つでも失敗したらSNA

		let arr = [0x10, 0x81, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), ret_esv, ret_opc, retDetails ];
		// console.dir( arr.flat(Infinity) ) ;
		EL.sendArray( rinfo.address, arr.flat(Infinity) );
	},

};

module.exports = {EL, mainEL};
//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
