//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.09.05 (MIT License)
//	Based on OWADA Shigeru 2020.12.24 (MIT License)
//////////////////////////////////////////////////////////////////////
'use strict'

//////////////////////////////////////////////////////////////////////
// 基本ライブラリ
const path = require('path');
const os = require('os');
const fs = require('fs');



//////////////////////////////////////////////////////////////////////
// 基本設定，electronのファイル読み込み対策，developmentで変更できるようにした（けどつかってない）
const appname  = 'MoekadenRoomJS';
const appDir   = process.env.NODE_ENV === 'development' ? __dirname : __dirname;
const isWin    = process.platform == "win32" ? true : false;
const isMac    = process.platform == "darwin" ? true : false;
const userHome = process.env[ isWin ? "USERPROFILE" : "HOME"];
const isDevelopment = process.env.NODE_ENV == 'development'


//////////////////////////////////////////////////////////////////////
// 追加ライブラリ
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const cron = require('node-cron');
const { EL, mainEL } = require('./mainEL');
require('date-utils');


// electron設定とmain window
app.disableHardwareAcceleration();
let mainWindow = null;


// アプリのconfig
let config = {
	width: isWin?860: isMac?854 :860,  // win = innerWidth:854 + 16
	height: isWin?529: isMac?480 :529,   // innerHight:480 + 59
	// debug: true
	debug: false
};

//////////////////////////////////////////////////////////////////////
// 内部関数

// 文字列0をつなげて，後ろから2文字分スライスする
let Byte2HexString = function (byte) {
	return (("0" + byte.toString(16)).slice(-2));
};


function sendDevState() {
	// 機器の状態変化があれば画面に反映
	sendIPCMessage( 'draw', {
		aircon: devState['013001'],
		light: devState['029001'],
		curtain: devState['026001'],
		lock: devState['026f01'],
		thermometer: devState['001101'],
		smartmeter: devState['028801']
	} );
}


//////////////////////////////////////////////////////////////////////
// ECHONET Lite管理

let devState = {
	'013001': {  // aircon
		// super
		'80': [0x31], // 動作状態
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'8f': [0x42], // 節電動作設定
		'b0': [0x42], // 運転モード設定
		'b3': [0x14], // 温度設定
		'bb': [0x14], // 室内温度計測値
		'a0': [0x41]  // 風量設定
	},
	'029001': {  // lighting
		// super
		'80': [0x31], // 動作状態
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'b6': [0x42] // 点灯モード設定
	},
	'026001': {  // blind = curtain
		// super
		'80': [0x30], // 動作状態, on
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'e0': [0x41]
	},
	'026f01': {  // electnic lock
		// super
		'80': [0x30], // 動作状態, on
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'e0': [0x41]  // 施錠設定１
	},
	'001101': {  // thermometer
		// super
		'80': [0x30], // 動作状態, on
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'e0': ['00', 'dc']  // 温度計測値
	},
	'028801': {  // smart meter
		// super
		'80': [0x30], // 動作状態, on
		'81': [0x0f], // 設置場所
		'82': [0x00, 0x00, 0x50, 0x01],  // spec version, P. rev1
		'83': [0xfe, 0x00, 0x00, 0x77, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07], // identifier, initialize時に、renewNICList()できちんとセットする
		'88': [0x42], // 異常状態, 0x42 = 異常無
		'8a': [0x00, 0x00, 0x77],  // maker code, kait
		'9d': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // inf map, 1 Byte目は個数
		'9e': [0x04, 0x80, 0x8f, 0xa0, 0xb0],  // set map, 1 Byte目は個数
		'9f': [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f], // get map, 1 Byte目は個数
		// uniq
		'd3': [0x00, 0x00, 0x00, 0x01],  // 係数
		'd7': [0x08],  // 積算電力量有効桁数
		'e0': [0x02],  // 積算電力量計測値（正）
		'e1': [0x02],  // 積算電力量単位（正）, 0x02 = 0x01kWh
		'e2': [], // 積算電力量計測値履歴１（正）
		'e5': [0x00], // 積算履歴収集日１
		'e7': [0x10], // 瞬時電力計測値
		'e8': [0x00, 0x10, 0x00, 0x00], // 瞬時電力計測値
		'ea': []  // 定時積算電力量計測値
	}
};

// エアコン
let getAircon = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['013001'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['013001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setAircon = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['013001'][epc]) { // 持ってるEPCのとき
			devState['013001'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SET_RES, EL.toHexArray(epc), devState['013001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			if( els.ESV == EL.SETC ) {
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
			}else{
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
			}
		}
	}
};

// ライト
let getLight = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['029001'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['029001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setLight = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['029001'][epc]) { // 持ってるEPCのとき
			devState['029001'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SET_RES, EL.toHexArray(epc), devState['029001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			if( els.ESV == EL.SETC ) {
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
			}else{
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
			}
		}
	}
};

// 鍵
let getLock = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['026f01'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['026f01'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setLockon = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['026f01'][epc]) { // 持ってるEPCのとき
			devState['026f01'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['026f01'][epc]);
		} else { // 持っていないEPCのとき, SNA
			if( els.ESV == EL.SETC ) {
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
			}else{
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
			}
		}
	}
};

// カーテン
let getCurtain = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['026001'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['026001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setCurtain = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['026001'][epc]) { // 持ってるEPCのとき
			devState['026001'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['026001'][epc]);
		} else { // 持っていないEPCのとき, SNA
			if( els.ESV == EL.SETC ) {
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
			}else{
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
			}
		}
	}
};

// スマメ
let getSmartmeter = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['028801'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['028801'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setSmartmeter = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['028801'][epc]) { // 持ってるEPCのとき
			devState['028801'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['028801'][epc]);
		} else { // 持っていないEPCのとき, SNA
			if( els.ESV == EL.SETC ) {
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETC_SNA, EL.toHexArray(epc), [0x00]);
			}else{
				EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.SETI_SNA, EL.toHexArray(epc), [0x00]);
			}
		}
	}
};

// 温度計
let getThermometer = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['001101'][epc]) { // 持ってるEPCのとき
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['001101'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};

let setThermometer = function(rinfo, els) {
	for (let epc in els.DETAILs) {
		if (devState['001101'][epc]) { // 持ってるEPCのとき
			devState['001101'][epc] = els.DETAILs[epc];
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), devState['001101'][epc]);
		} else { // 持っていないEPCのとき, SNA
			EL.replyOPC1(rinfo.address, EL.toHexArray(els.TID), EL.toHexArray(els.DEOJ), EL.toHexArray(els.SEOJ), EL.GET_SNA, EL.toHexArray(epc), [0x00]);
		}
	}
};



let ELStart = async function() {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| ELStart()'):0;

	// mainEL初期設定
	await mainEL.start( {network: config.network, EL: config.EL},
						(rinfo, els, err) => {  // els received, 受信のたびに呼ばれる
							config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ELStart():', els):0;

							if( els ) {
								console.dir( els );
							}

							switch( els.ESV ) {
								case '60':  // SET_I
								case '61':  // SET_C
								switch( els.DEOJ.substr(0,4) ) {
									case '0130':  // エアコン
									setAircon( rinfo, els );
									break;

									case '0290':  // ライト
									setLight( rinfo, els );
									break;

									case '0260':  // カーテン
									setCurtain( rinfo, els );
									break;

									case '026f':  // 鍵
									setLock( rinfo, els );
									break;

									case '0011':  // 温度計
									setThermometer( rinfo, els );
									break;

									case '0288':  // スマメ
									setSmartmeter( rinfo, els );
									break;
								}
								break;

								case '62':  // GET
								switch( els.DEOJ.substr(0,4) ) {
									case '0130':  // エアコン
									getAircon( rinfo, els );
									break;

									case '0290':  // ライト
									getLight( rinfo, els );
									break;

									case '0260':  // カーテン
									getCurtain( rinfo, els );
									break;

									case '026f':  // 鍵
									getLock( rinfo, els );
									break;

									case '0011':  // 温度計
									getThermometer( rinfo, els );
									break;

									case '0288':  // スマメ
									getSmartmeter( rinfo, els );
									break;
								}
								break;
							}

							// 機器の状態変化があれば画面に反映
							sendDevState();
						},
						(facilities) => {  // change facilities, 全体監視して変更があったときに全体データとして呼ばれる
							// 特に何もしない
						});


	// 各機器の識別番号をmac addressを利用したNode_profileを参照して更新
	devState['013001']['83'][7]  = devState['029001']['83'][7]  = devState['026001']['83'][7]  = devState['026f01']['83'][7]  = devState['001101']['83'][7]  = devState['028801']['83'][7]  = EL.Node_details["83"][7];
	devState['013001']['83'][8]  = devState['029001']['83'][8]  = devState['026001']['83'][8]  = devState['026f01']['83'][8]  = devState['001101']['83'][8]  = devState['028801']['83'][8]  = EL.Node_details["83"][8];
	devState['013001']['83'][9]  = devState['029001']['83'][9]  = devState['026001']['83'][9]  = devState['026f01']['83'][9]  = devState['001101']['83'][9]  = devState['028801']['83'][9]  = EL.Node_details["83"][9];
	devState['013001']['83'][10] = devState['029001']['83'][10] = devState['026001']['83'][10] = devState['026f01']['83'][10] = devState['001101']['83'][10] = devState['028801']['83'][10] = EL.Node_details["83"][10];
	devState['013001']['83'][11] = devState['029001']['83'][11] = devState['026001']['83'][11] = devState['026f01']['83'][11] = devState['001101']['83'][11] = devState['028801']['83'][11] = EL.Node_details["83"][11];
	devState['013001']['83'][12] = devState['029001']['83'][12] = devState['026001']['83'][12] = devState['026f01']['83'][12] = devState['001101']['83'][12] = devState['028801']['83'][12] = EL.Node_details["83"][12];

	EL.sendOPC1( EL.EL_Multi,  '0ef001', '0ef001', EL.INF, '80', '30');
	EL.sendOPC1( EL.EL_Multi6, '0ef001', '0ef001', EL.INF, '80', '30');
};


//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
ipcMain.handle( 'already', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already, devState:', devState):0;


	// 一旦初期値を送る
	sendDevState();

	ELStart();
});


// GUIのボタン処理
// 鍵, 026f
ipcMain.handle( 'Lockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Lockkey'):0;


	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '41');

	devState['026f01']['e0'] = '41'; // Locked
	sendDevState();
});

ipcMain.handle( 'Unlockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Unlockkey'):0;

	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '42');
	devState['026f01']['e0'] = '42';  // Unlocked
	sendDevState();
});


// カーテン, 0260
ipcMain.handle( 'Closecurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Closecurtain'):0;

	devState['026001']['e0'] = '42';  // Close
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', '42');
});

ipcMain.handle( 'Opencurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Opencurtain'):0;

	devState['026001']['e0'] = '41';  // Open
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', '41');
});

// ライト, 0290
ipcMain.handle( 'Onlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onlight'):0;

	devState['029001']['80'] = '30';  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', '30');
});

ipcMain.handle( 'Offlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offlight'):0;

	devState['029001']['80'] = '31';  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', '31');
});

// 温度計, 0011
ipcMain.handle( 'Uptemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uptemperature'):0;

	let temp = parseInt( devState['001101']['e0'][0] + devState['001101']['e0'][1], 16 );
	// console.log( 'devState:', devState['001101']['e0'][0], devState['001101']['e0'][1], 'temp:', temp );

	temp += 10;
	if( temp > 32760 ) { temp = 32760; }

	let temp_u = Byte2HexString( Math.floor(temp / 256) );
	let temp_d = Byte2HexString( temp % 256 );

	devState['001101']['e0'][0] = temp_u;
	devState['001101']['e0'][1] = temp_d;

	sendDevState();
});

ipcMain.handle( 'Downtemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downtemperature'):0;

	let temp = parseInt( devState['001101']['e0'][0] + devState['001101']['e0'][1], 16 );
	// console.log( 'devState:', devState['001101']['e0'][0], devState['001101']['e0'][1], 'temp:', temp );

	temp -= 10;
	if( temp < -2730 ) { temp = 2730; }

	let temp_u = Byte2HexString( Math.floor(temp / 256) );
	let temp_d = Byte2HexString( temp % 256 );

	devState['001101']['e0'][0] = temp_u;
	devState['001101']['e0'][1] = temp_d;
	console.log( 'devState:', devState['001101']['e0'][0], devState['001101']['e0'][1] );

	sendDevState();
});


// エアコン上段, 0130
ipcMain.handle( 'Onaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onaircon'):0;

	devState['013001']['80'] = '30';  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', '30');
});

ipcMain.handle( 'Offaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offaircon'):0;

	devState['013001']['80'] = '31';  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', '31');
});

ipcMain.handle( 'Upaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uparicon'):0;

	let temp = parseInt( devState['013001']['b3'], 16 );

	temp += 1;
	if( temp > 50 ) { temp = 50; }

	devState['013001']['b3'] = Byte2HexString( temp );

	sendDevState();
});

ipcMain.handle( 'Downaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downaircon'):0;

	let temp = parseInt( devState['013001']['b3'], 16 );

	temp -= 1;
	if( temp < 0 ) { temp = 0; }

	devState['013001']['b3'] = Byte2HexString( temp );

	sendDevState();
});

// エアコン下段
ipcMain.handle( 'Autoaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Autoaircon'):0;

	devState['013001']['b0'] = '41';  // auto
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', '41');
});

ipcMain.handle( 'Coolaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Coolaircon'):0;

	devState['013001']['b0'] = '42';  // cool
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', '42');
});

ipcMain.handle( 'Heataircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Heataircon'):0;

	devState['013001']['b0'] = '43';  // heat
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', '43');
});

ipcMain.handle( 'Dryaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Dryaircon'):0;

	devState['013001']['b0'] = '44';  // dry
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', '44');
});

ipcMain.handle( 'Windaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Windaircon'):0;

	devState['013001']['b0'] = '45';  // wind
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', '45');
});


//////////////////////////////////////////////////////////////////////
// foreground
// ここがEntrypointと考えても良い
async function createWindow() {
	// 画面の起動
	mainWindow = new BrowserWindow({
		width:  config.width,
		height: config.height,
		resizable: false,
		webPreferences: {
			nodeIntegration: false, // default:false
			contextIsolation: true, // default:true
			worldSafeExecuteJavaScript: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});
	menuInitialize();
	// mainWindow.loadURL( path.join(__dirname, 'public', 'index.htm') );  // MacだとloadURLが動かない
	mainWindow.loadFile( path.join(__dirname, 'public', 'index.htm') );

	if (config.debug) { // debugモードならDebugGUIひらく
		mainWindow.webContents.openDevTools();
	}


	// window closeする処理にひっかけて直前処理
	mainWindow.on('close', async () => {
		config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.mainWindow.on.close'):0;
	});

	// window closeした後にひっかけて直後処理
	mainWindow.on('closed', async () => {
		config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.mainWindow.on.closed'):0;
		mainWindow = null;
	});
};

app.on('ready', async () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.ready'):0;
	createWindow();
});

// アプリケーションがアクティブになった時の処理
// （Macだと、Dockがクリックされた時）
app.on("activate", () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.active'):0;
	// メインウィンドウが消えている場合は再度メインウィンドウを作成する
	if (mainWindow === null) {
		createWindow();
	}
});

// window全部閉じたらappも終了する
app.on('window-all-closed', async () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.window-all-closed'):0;
	EL.release();
	app.quit();	// macだろうとプロセスはkillしちゃう
});

// menu
const menuItems = [{
	label: appname,
	submenu: [
		{
			label: 'About this',
			accelerator: isMac ? 'Command+?' : 'Alt+?',
			click: function () { aboutThis(); }
		}, {
			label: 'Quit',
			accelerator: isMac ? 'Command+Q' : 'Alt+F4',
			click: function () { app.quit(); }
		}]
}, {
	label: 'View',
	submenu: [
		{
			label: 'Reload',
			accelerator: isMac ? 'Command+R' : 'Control+R',
			click(item, focusedWindow) {
				if (focusedWindow) focusedWindow.reload()
			}
		},
		{
			label: 'Toggle Full Screen',
			accelerator: isMac ? 'Ctrl+Command+F' : 'F11',
			click: function () { mainWindow.setFullScreen(!mainWindow.isFullScreen()); }
		},
		{
			label: 'Toggle Developer Tools',
			accelerator: isMac ? 'Ctrl+Command+I' : 'Control+Shift+I',
			click: function () { mainWindow.toggleDevTools(); }
		}		]
}];


function menuInitialize() {
	let menu = Menu.buildFromTemplate(menuItems);
	Menu.setApplicationMenu(menu);
	mainWindow.setMenu(menu);
}


// IPC通信の定式
let sendIPCMessage = function( cmdStr, argStr ) {
	if( mainWindow != null && mainWindow.webContents != null ) {
		mainWindow.webContents.send('to-renderer', JSON.stringify({ cmd: cmdStr, arg: argStr} ) );
	}
};


// About this
function aboutThis () {
	const options = {
		type: 'info',
		title: 'MoekadenRoomJS',
		message: 'MoekadenRoomJS Version 1.0.0',
		detail: 'This is an ECHONET Lite Emulator, called MoekadenRoomJS.\nIt is based on Moekaden made by SonyCSL, which is MIT License.\n\n- MoekadenRoomJS: https://github.com/Hiroshi-Sugimura/MoekadenRoomJS\n- ModekadenRoom: https://github.com/SonyCSL/MoekadenRoom'
	};

	dialog.showMessageBox(options);
}

//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
