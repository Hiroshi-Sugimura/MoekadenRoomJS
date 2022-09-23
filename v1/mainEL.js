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

// 基礎設定
const appDir     = process.env.NODE_ENV === 'development' ? __dirname : __dirname;

//////////////////////////////////////////////////////////////////////
// ExportするObj
let mainEL = {
	objList: [],
	elsocket: null,
	recv_callback: null,
	config: { },

	devState: {
		'001101': {  // thermometer
			// super
			'80': [0x30], // 動作状態, on, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x54, 0x68, 0x65, 0x72, 0x6d, 0x6f, 0x00, 0x00, 0x00],  // 商品コード (MoeThermo)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
			'9e': [0x01, 0x81],  // set map, 1 Byte目は個数, get
			'9f': [0x0e, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
			// uniq
			'e0': [0x00, 0xdc]  // 温度計測値, get
		},
		'013001': {  // aircon
			// super
			'80': [0x31], // 動作状態, set?, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, ,get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x41, 0x69, 0x72, 0x63, 0x6f, 0x6e, 0x00, 0x00, 0x00],  // 商品コード (MoeAircon)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x05, 0x80, 0x81, 0x8f, 0xb0, 0xa0],  // inf map, 1 Byte目は個数, get
			'9e': [0x06, 0x80, 0x81, 0x8f, 0xb0, 0xb3, 0xa0],  // set map, 1 Byte目は個数, get
			'9f': [0x12, 13,  1,  1,  9,  0,  0,  0,  0,  1,  0,  1,  9,  1,  3,  3,  3], // get map, 1 Byte目は個数, 記述形式2, get
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
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x43, 0x75, 0x72, 0x74, 0x61, 0x69, 0x6e, 0x00, 0x00],  // 商品コード (MoeCurtain)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
			'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
			'9f': [0x0e, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
			// uniq
			'e0': [0x41]  // 開閉動作設定, set, get, inf
		},
		'026f01': {  // electnic lock
			// super
			'80': [0x30], // 動作状態, on, get, inf
			'81': [0x0f], // 設置場所, set, get, inf
			'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1, get
			'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05], // identifier, initialize時に、renewNICList()できちんとセットする, get
			'88': [0x42], // 異常状態, 0x42 = 異常無, get
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x4c, 0x6f, 0x63, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x00],  // 商品コード (MoeLock)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x03, 0x80, 0x81, 0xe0],  // inf map, 1 Byte目は個数, get
			'9e': [0x02, 0x81, 0xe0],  // set map, 1 Byte目は個数, get
			'9f': [0x0e, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xe0], // get map, 1 Byte目は個数, get
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
			'8a': [0x00, 0x00, 0x60],  // maker code, SonyCSL, get
			'8b': [0x00, 0x02], // 事業場コード
			'8c': [0x4d, 0x6f, 0x65, 0x4c, 0x69, 0x67, 0x68, 0x74, 0x69, 0x6e, 0x67, 0x00],  // 商品コード (MoeLighting)
			'8d': [0x34, 0x31, 0x33, 0x31, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 製造番号
			'8e': [0x07, 0xe6, 0x09, 0x01],  // 製造年月日 2022/9/1
			'9d': [0x02, 0x80, 0x81],  // inf map, 1 Byte目は個数, get
			'9e': [0x03, 0x80, 0x81, 0xb6],  // set map, 1 Byte目は個数, get
			'9f': [0x0e, 0x80, 0x81, 0x82, 0x83, 0x88, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x9d, 0x9e, 0x9f, 0xb6], // get map, 1 Byte目は個数, get
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
		mainEL.elsocket = await EL.initialize( mainEL.objList,
											   mainEL.ELreceived,
											   0,  // IPversion 4 and 6
											   {
												   ignoreMe:true,
												   autoGetProperties: false,
												   debugMode: false
											   });

		// 各機器の識別番号をmac addressを利用したNode_profileを参照して更新
		mainEL.devState['013001']['83'][7]  = mainEL.devState['029001']['83'][7]  = mainEL.devState['026001']['83'][7]  = mainEL.devState['026f01']['83'][7]  = mainEL.devState['001101']['83'][7]  = mainEL.devState['028801']['83'][7]  = EL.Node_details["83"][7];
		mainEL.devState['013001']['83'][8]  = mainEL.devState['029001']['83'][8]  = mainEL.devState['026001']['83'][8]  = mainEL.devState['026f01']['83'][8]  = mainEL.devState['001101']['83'][8]  = mainEL.devState['028801']['83'][8]  = EL.Node_details["83"][8];
		mainEL.devState['013001']['83'][9]  = mainEL.devState['029001']['83'][9]  = mainEL.devState['026001']['83'][9]  = mainEL.devState['026f01']['83'][9]  = mainEL.devState['001101']['83'][9]  = mainEL.devState['028801']['83'][9]  = EL.Node_details["83"][9];
		mainEL.devState['013001']['83'][10] = mainEL.devState['029001']['83'][10] = mainEL.devState['026001']['83'][10] = mainEL.devState['026f01']['83'][10] = mainEL.devState['001101']['83'][10] = mainEL.devState['028801']['83'][10] = EL.Node_details["83"][10];
		mainEL.devState['013001']['83'][11] = mainEL.devState['029001']['83'][11] = mainEL.devState['026001']['83'][11] = mainEL.devState['026f01']['83'][11] = mainEL.devState['001101']['83'][11] = mainEL.devState['028801']['83'][11] = EL.Node_details["83"][11];
		mainEL.devState['013001']['83'][12] = mainEL.devState['029001']['83'][12] = mainEL.devState['026001']['83'][12] = mainEL.devState['026f01']['83'][12] = mainEL.devState['001101']['83'][12] = mainEL.devState['028801']['83'][12] = EL.Node_details["83"][12];

	},


	//////////////////////////////////////////////////////////////////////
	// 各デバイスの処理開始

	// 文字列0をつなげて，後ろから2文字分スライスする
	Byte2HexString: function (byte) {
		return (("0" + byte.toString(16)).slice(-2));
	},


	//////////////////////////////////////////////////////////////////////
	// ECHONET Lite管理

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
				retDetails[epc] = [0x00];
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
				retDetails[epc] = [0x00];
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
				retDetails[epc] = [0x00];
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

	// 個別EPC
	setLockonSub: function(rinfo, els, epc, edt) {
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
	setLockon: async function(rinfo, els) {
		let success = true;
		let retDetails = [];
		let ret_opc = 0;
		// console.log( 'Recv DETAILs:', els.DETAILs );
		for (let epc in els.DETAILs) {
			// console.log( 'Now:', epc, mainEL.devState['026f01'][epc] );

			if( await mainEL.setLockonSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['026f01'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['026f01'][epc].length );
				retDetails.push( mainEL.devState['026f01'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['026f01'][epc] );
				retDetails[epc] = [0x00];
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
				retDetails[epc] = [0x00];
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

	setSmartmeter: function(rinfo, els) {
		for (let epc in els.DETAILs) {
			if (mainEL.devState['028801'][epc]) { // 持ってるEPCのとき
				mainEL.devState['028801'][epc] = els.DETAILs[epc];
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), mainEL.devState['028801'][epc]);
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

			if( await mainEL.setCurtainSub( rinfo, els, epc, els.DETAILs[epc] ) ) {
				// console.log( 'New:', epc, mainEL.devState['001101'][epc] );
				retDetails.push( parseInt(epc,16) );  // epcは文字列なので
				retDetails.push( mainEL.devState['001101'][epc].length );
				retDetails.push( mainEL.devState['001101'][epc] );
				// console.log( 'retDetails:', retDetails );
			}else{
				// console.log( 'failed:', epc, mainEL.devState['001101'][epc] );
				retDetails[epc] = [0x00];
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
