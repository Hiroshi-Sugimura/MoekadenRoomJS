//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2020.10.30
//////////////////////////////////////////////////////////////////////
'use strict'

//////////////////////////////////////////////////////////////////////
// 基本ライブラリ
const fs   = require('fs');
const path = require('path');
const EL = require('echonet-lite');
const ELconv = require('echonet-lite-conv');

// 基礎設定
const appDir     = process.env.NODE_ENV === 'development' ? __dirname : __dirname;

//////////////////////////////////////////////////////////////////////
// config
let mainEL = {
  api: null,
  conv: null,
  objList: [],
  controllerObj: {},
  elsocket: null,
  devList: [],
  observationDevs: [],  // 監視対象
  observationTimerEnabled: false,
  observationTimerID: {}, // ID管理，Timeoutクラス
  observationBaseInterval: 60000, // 1分周期監視
  recv_callback: null,
  change_callback: null
};

let config = {
};

// 辞書の読み込みをオーバーライド
ELconv.initialize = function () {
	ELconv.m_dictNod    = JSON.parse( fs.readFileSync(path.join(appDir,'nodeProfile.json'), 'utf8') );
	ELconv.m_dictSup    = JSON.parse( fs.readFileSync(path.join(appDir,'superClass_I.json'), 'utf8') );
	ELconv.m_dictDev    = JSON.parse( fs.readFileSync(path.join(appDir,'deviceObject_I.json'), 'utf8') );
	ELconv.m_dictMakers = JSON.parse( fs.readFileSync(path.join(appDir,'makers.json'), 'utf8') );
};

ELconv.initialize();

mainEL.api = EL;
mainEL.conv = ELconv;


//////////////////////////////////////////////////////////////////////
// 内部
// EL受け取った後の処理
let ELreceived = function( rinfo, els, err ) {
	if( err ) {
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() error:', error);
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() rinfo:', rinfo);
		console.error( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.ELreceived() els:', els);
		throw err;
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

	mainEL.recv_callback(rinfo, els, err);
};


//////////////////////////////////////////////////////////////////////
// ELの処理開始
mainEL.start = async function( _config, receive_cb, change_cb ) {
	config = _config;

	mainEL.objList = ['05ff01'];
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
	mainEL.change_callback = change_cb;
	mainEL.observationBaseInterval = 60000;  // 60000ms = 1min
	mainEL.devList = [];

	if( !mainEL.observationDevs ) {  // null対策
		mainEL.observationDevs = [];
	}

	// ECHONET Lite socket
	mainEL.elsocket = EL.initialize( mainEL.objList,
									 ELreceived,
									 config.network.IPver,
									 {
										 v4: config.network.IPv4 == 'auto' ? '' : config.network.IPv4,
										 v6: config.network.IPv6 == 'auto' ? '' : config.network.IPv6,
										 ignoreMe:true,
										 autoGetProperties: true,
										 autoGetDelay: 1000,
										 debugMode: false
									 });


	// EL.facilitiesに変化があればUIに反映
	EL.setObserveFacilities( 3000, function() {

		mainEL.devList = EL.identificationNumbers;

		// 監視デバイスリストも作る
		mainEL.devList.forEach( (d) => {
			// 監視対象デバイス
			switch( d.OBJ.substr(0,4) ) {
			  case '0022': // 電力量センサ0022,e0(4Bytes, x0.001kWh)
				mainEL.addObservation( d.id, d.OBJ, 'e0');
				break;
			  case '0281': // 水流量メータ0281,e0(4Bytes, m^3)
				mainEL.addObservation( d.id, d.OBJ, 'e0');
				break;
			  case '0282': // ガスメータ0282,e0(4Bytes, 0.001m^3)
				mainEL.addObservation( d.id, d.OBJ, 'e0');
				break;
			  case '0287': // 分電盤メータ0287,c0(4Bytes, kWh)
				mainEL.addObservation( d.id, d.OBJ, 'c0');
				break;
			  case '0288': // 低圧スマート電力量メータ0288,e0(4Bytes, kWh)
				mainEL.addObservation( d.id, d.OBJ, 'e0');
				break;
			}
		});

		// UIに反映
		mainEL.change_callback( EL.facilities );
	});

	// 監視開始
	mainEL.startObservation( mainEL.observationBaseInterval );
};


//////////////////////////////////////////////////////////////////////
// 定期的なデバイスの監視
// 監視はIPアドレスが変更される可能性に注意すべし

// EPC単位でEDTをGetするための内部関数（mainEL.startObservationEPCを呼ぶこと）
mainEL.getEDTinTimer = function( dev ) {
	let d = mainEL.devList.find( e => e.id == dev.id );
	if( !d ) { // そのようなデバイスはない
		config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.getEDTinTimer() no device:', dev ):0;
	}else{  // デバイス発見した
		config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.getEDTinTimer() found ip:', d.ip, 'obj:', dev.obj, 'epc', dev.epc ):0;
		mainEL.api.sendOPC1( d.ip, '05FF01', dev.obj, EL.GET, dev.epc, [0x00]);
	}

	// 処理をしたので次のタイマーをセット
	if( mainEL.observationTimerEnabled == true ) {
		mainEL.startObservationEPC( dev );
	}
};

// EPC毎にタイマー管理
// ネットワーク負荷分散と家電機器への負荷分散を考慮して
// 同時にアクセスしないよう，intervalをベースに0から30秒のランダム時間を追加してセット
mainEL.startObservationEPC = function( dev ) {
	let rand_interval = Math.round( Math.random() * 30000 ) + mainEL.observationBaseInterval;
	// console.log( 'Next obs.:', 'interval', rand_interval, dev.id, dev.obj );
	mainEL.observationTimerID[ dev.id + '-' +  dev.obj + '-' + dev.epc ] = setTimeout( mainEL.getEDTinTimer, rand_interval, dev );
};


// 監視対象デバイスを追加して，監視スタート
mainEL.addObservation = function( id, obj, epc ) {

	// 既に監視しているEPCは監視しない
	let findObj = mainEL.observationDevs.find( (d) => {
		if( d.id == id && d.obj == obj && d.epc == epc ) {return d;}
	} );

	if( findObj ) { // 既に監視対象なので何もしない
		// console.log('found obsrv:', id, obj, epc);
		return;
	}

	config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.addObservation id:', id, 'obj:', obj, 'epc:', epc ):0;

	// 監視対象として登録されていなかったので登録
	mainEL.observationDevs.push( {id:id, obj:obj, epc:epc} );

	// 現在の監視対象リスト
	config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.observationDevs:', mainEL.observationDevs):0;

	// 実際に監視スタート
	mainEL.startObservationEPC( {id:id, obj:obj, epc:epc}, mainEL.observationBaseInterval );
};


// configファイルにobservationDevsが設定されていればそれを監視し始める
mainEL.startObservation = function ( ) {
	if( mainEL.observationTimerEnabled == true ) { // もう開始していたら無視
		return;
	}
	mainEL.observationTimerEnabled = true;
	config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.startObservation:', mainEL.observationBaseInterval, 'ms' ):0;

	if( mainEL.observationDevs ) {// 監視対象が設定ファイルにあれば
		mainEL.observationDevs.forEach( (d) => {
			mainEL.startObservationEPC( d );
		} );
	}
};

// 監視行動をやめて，タイマーも解放する
mainEL.stopObservation = function() {
	if( !config || !config.EL ) {
		return;
	}
	mainEL.observationTimerEnabled = false;
	config.EL.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| mainEL.stopObservation.' ):0;

	for( let key in mainEL.observationTimerID ) {
		clearTimeout ( mainEL.observationTimerID[key] );
	}
};


//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
module.exports = mainEL;

