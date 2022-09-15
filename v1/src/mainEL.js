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
		if ( els.DEOJ.substr(0, 4) == '05ff' ) {
			// ESVで振り分け，主に0x60系列に対応すればいい
			switch (els.ESV) {
				////////////////////////////////////////////////////////////////////////////////////
				// 0x6x
				case EL.SETI:// "60
				break;
				case EL.SETC:// "61"，返信必要あり
				break;

				case EL.GET:// 0x62，Get
				for (var epc in els.DETAILs) {
					if (mainEL.controllerObj[epc]) {// 持ってるEPCのとき
						EL.sendOPC1(rinfo.address, [0x05, 0xFF, 0x01], EL.toHexArray(els.SEOJ), EL.GET_RES, EL.toHexArray(epc), mainEL.controllerObj[epc]);
					} else {// 持っていないEPCのとき, SNA
						EL.sendOPC1(rinfo.address, [0x05, 0xFF, 0x01], EL.toHexArray(els.SEOJ), EL_GET_SNA, EL.toHexArray(epc), [0x00]);
					}
				}
				break;

				case EL.INFREQ:// 0x63
				break;

				case EL.SETGET:// "6e"
				break;

				default:
				break;
			}
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
	}


};

module.exports = {EL, mainEL};
//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
