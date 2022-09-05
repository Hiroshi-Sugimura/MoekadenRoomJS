//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2020.10.30
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
// config
let mainEL = {
  api: null,
  objList: [],
  controllerObj: {},
  elsocket: null,
  recv_callback: null
};

let config = {
};

mainEL.api = EL;


//////////////////////////////////////////////////////////////////////
// 内部
// EL受け取った後の処理
let ELreceived = function( rinfo, els, error ) {
	if( error ) {
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() error:', error);
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() rinfo:', rinfo);
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() els:', els);
		throw error;
	}

	// config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() rinfo:', rinfo, '\nels:', els ):0;

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
					EL.sendOPC1(rinfo.address, [0x05, 0xFF, 0x01], EL.toHexArray(els.SEOJ), 0x72, EL.toHexArray(epc), mainEL.controllerObj[epc]);
				} else {// 持っていないEPCのとき, SNA
					EL.sendOPC1(rinfo.address, [0x05, 0xFF, 0x01], EL.toHexArray(els.SEOJ), 0x52, EL.toHexArray(epc), [0x00]);
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
};


//////////////////////////////////////////////////////////////////////
// ELの処理開始
mainEL.start = async function( _config, receive_cb, change_cb ) {
	config = _config;

	mainEL.objList = ['05ff01', '013001', '029001', '026001', '026f01', '001101', '028801'];
	mainEL.controllerObj = {
		// super
		"80": [0x30],// 動作状態
		"81": [0xff],// 設置場所
		"82": [0x00, 0x00, 0x66, 0x00],// EL version, 1.1
		"88": [0x42],// 異常状態
		"8a": [0x00, 0x00, 0x77],// maker code
		"9d": [0x04, 0x80, 0x8f, 0xa0, 0xb0],// inf map, 1 Byte目は個数
		"9e": [0x04, 0x80, 0x8f, 0xa0, 0xb0],// set map, 1 Byte目は個数
		"9f": [0x09, 0x80, 0x81, 0x82, 0x88, 0x8a, 0x8f, 0x9d, 0x9e, 0x9f]// get map, 1 Byte目は個数
			// child
	};

	mainEL.recv_callback = receive_cb;

	// ECHONET Lite socket
	mainEL.elsocket = EL.initialize( mainEL.objList,
									 ELreceived,
									 0,  // IPversion 4 and 6
									 {
										 ignoreMe:true,
										 autoGetProperties: false,
										 debugMode: false
									 });

};


//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
module.exports = mainEL;

