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
const isLinux  = process.platform == "linux" ? true : false;
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
let drawTimer = null;  // periodic draw push


// アプリのconfig
let config = {
  width: isWin?860: isMac?854 : isLinux? 854: 860,  // win = innerWidth:854 + 16
  height: isWin?529: isMac?480 : isLinux? 480: 529,   // innerHight:480 + 59
	// debug: true
	debug: false,
	EL: {
		v4: '',
		v6: '',
		ignoreMe:true,
		autoGetProperties: false,
		debugMode: false
	}
};

//////////////////////////////////////////////////////////////////////
// 内部関数

/**
 * レンダラーへ現在の機器状態を送信する。
 * smartmeterは追加情報（瞬時電力W、履歴cumLog、単位e1）を含む。
 * @returns {void}
 */
function sendDevState() {
	// 機器の状態変化があれば画面に反映
	sendIPCMessage( 'draw', {
		aircon: mainEL.devState['013001'],
		light: mainEL.devState['029001'],
		curtain: mainEL.devState['026001'],
		lock: mainEL.devState['026f01'],
		thermometer: mainEL.devState['001101'],
		smartmeter: {
			...mainEL.devState['028801'],
			instantaneousPower: mainEL.getInstantaneousEnergy(),  // W単位
			cumLog: mainEL.cumLog,  // 履歴データ
			e1: mainEL.devState['028801']['e1']  // 積算電力量単位
		}
	} );
}




/**
 * ECHONET Liteの初期化と受信ハンドラ設定を行う。
 * 起動時にノードプロファイルのINFを送信する。
 * @returns {Promise<void>}
 */
let ELStart = async function() {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| ELStart()'):0;

	// mainEL初期設定
	await mainEL.start( config.EL,
						(rinfo, els, err) => {  // els received, 受信のたびに呼ばれる
							config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ELStart():', els):0;
							// 機器の状態変化があれば画面に反映
							sendDevState();
						},
						(facilities) => {  // change facilities, 全体監視して変更があったときに全体データとして呼ばれる
							// 特に何もしない
						});

	EL.sendOPC1( EL.EL_Multi,  '0ef001', '0ef001', EL.INF, '80', '30');
	EL.sendOPC1( EL.EL_Multi6, '0ef001', '0ef001', EL.INF, '80', '30');
};

//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
/**
 * IPC 'already' 初期化ハンドラ。
 * レンダラー準備完了時に初期状態を送出し、ELを開始、以後1秒毎に状態更新を送信。
 * @param {Electron.IpcMainInvokeEvent} event - IPCイベント
 * @param {*} arg - 追加引数（未使用）
 * @returns {Promise<void>}
 */
ipcMain.handle( 'already', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already, mainEL.devState:', mainEL.devState):0;
	sendDevState();
		ELStart();

		// periodic push to renderer so graphs update
		if( !drawTimer ) {
			drawTimer = setInterval(() => {
				try { sendDevState(); } catch(e) { /* swallow */ }
			}, 1000);
		}
});
/**
 * IPC 'Lockkey'：電子錠を施錠に変更。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Lockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Lockkey'):0;


	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '41');

	mainEL.devState['026f01']['e0'] = [0x41]; // Locked
	sendDevState();
});

/**
 * IPC 'Unlockkey'：電子錠を解錠に変更。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Unlockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Unlockkey'):0;

	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '42');
	mainEL.devState['026f01']['e0'] = [0x42];  // Unlocked
	sendDevState();
});


// カーテン, 0260
/**
 * IPC 'Closecurtain'：カーテンを閉じる。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Closecurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Closecurtain'):0;

	mainEL.devState['026001']['e0'] = [0x42];  // Close
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', mainEL.devState['026001']['e0']);
});

/**
 * IPC 'Opencurtain'：カーテンを開く。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Opencurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Opencurtain'):0;

	mainEL.devState['026001']['e0'] = [0x41];  // Open
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', mainEL.devState['026001']['e0']);
});

// ライト, 0290
/**
 * IPC 'Onlight'：照明をオン。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Onlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onlight'):0;

	mainEL.devState['029001']['80'] = [0x30];  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', mainEL.devState['029001']['80'] );
});

/**
 * IPC 'Offlight'：照明をオフ。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Offlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offlight'):0;

	mainEL.devState['029001']['80'] = [0x31];  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', mainEL.devState['029001']['80']);
});

// 温度計, 0011
/**
 * IPC 'Uptemperature'：温度計表示値を+1.0℃。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Uptemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uptemperature'):0;

	let temp = mainEL.devState['001101']['e0'][0] * 256 + mainEL.devState['001101']['e0'][1];
	// console.log( 'now temp:', mainEL.devState['001101']['e0'][0], mainEL.devState['001101']['e0'][1], 'temp:', temp*0.1 );

	temp += 10;
	if( temp > 32760 ) { temp = 32760; }

	let temp_h =  Math.floor(temp / 256);
	let temp_l = temp % 256;

	mainEL.devState['001101']['e0'] = [temp_h,temp_l];
	// console.log( 'new temp:', mainEL.devState['001101']['e0'][0], mainEL.devState['001101']['e0'][1], 'temp:', temp*0.1 );

	sendDevState();
});

/**
 * IPC 'Downtemperature'：温度計表示値を-1.0℃。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Downtemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downtemperature'):0;

	let temp = mainEL.devState['001101']['e0'][0] * 256 + mainEL.devState['001101']['e0'][1];
	// console.log( 'now temp:', mainEL.devState['001101']['e0'][0], mainEL.devState['001101']['e0'][1], 'temp:', temp*0.1 );

	temp -= 10;
	if( temp < -2730 ) { temp = 2730; }

	let temp_h = Math.floor(temp / 256);
	let temp_l = temp % 256;

	mainEL.devState['001101']['e0'] = [temp_h,temp_l];
	// console.log( 'new temp:', mainEL.devState['001101']['e0'][0], mainEL.devState['001101']['e0'][1], 'temp:', temp*0.1 );

	sendDevState();
});


// エアコン上段, 0130
/**
 * IPC 'Onaircon'：エアコンをオン。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Onaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onaircon'):0;

	mainEL.devState['013001']['80'] = [0x30];  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', mainEL.devState['013001']['80']);
});

/**
 * IPC 'Offaircon'：エアコンをオフ。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Offaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offaircon'):0;

	mainEL.devState['013001']['80'] = [0x31];  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', mainEL.devState['013001']['80']);
});

/**
 * IPC 'Upaircon'：設定温度を+1。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Upaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uparicon'):0;

	let temp = mainEL.devState['013001']['b3'][0];
	// console.log( temp );

	temp += 1;
	// console.log( temp );
	if( temp > 50 ) { temp = 50; }

	mainEL.devState['013001']['b3'] = [temp];

	sendDevState();
});

/**
 * IPC 'Downaircon'：設定温度を-1。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Downaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downaircon'):0;

	let temp = mainEL.devState['013001']['b3'][0];

	temp -= 1;
	if( temp < 0 ) { temp = 0; }

	mainEL.devState['013001']['b3'] = [temp];

	sendDevState();
});

// エアコン下段
/**
 * IPC 'Autoaircon'：運転モードを自動に。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Autoaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Autoaircon'):0;

	mainEL.devState['013001']['b0'] = [0x41];  // auto
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

/**
 * IPC 'Coolaircon'：運転モードを冷房に。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Coolaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Coolaircon'):0;

	mainEL.devState['013001']['b0'] = [0x42];  // cool
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

/**
 * IPC 'Heataircon'：運転モードを暖房に。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Heataircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Heataircon'):0;

	mainEL.devState['013001']['b0'] = [0x43];  // heat
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

/**
 * IPC 'Dryaircon'：運転モードを除湿に。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Dryaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Dryaircon'):0;

	mainEL.devState['013001']['b0'] = [0x44];  // dry
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

/**
 * IPC 'Windaircon'：運転モードを送風に。
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {*} arg
 * @returns {Promise<void>}
 */
ipcMain.handle( 'Windaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Windaircon'):0;

	mainEL.devState['013001']['b0'] = [0x45];  // wind
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});


//////////////////////////////////////////////////////////////////////
// foreground
// ここがEntrypointと考えても良い
/**
 * メインウィンドウを作成し、UIをロードする。
 * DevToolsはdebugフラグが真のときに開く。
 * @returns {Promise<void>}
 */
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
		//////////////////////////////////////////////////////////////////////
		// Communication for Electron's Renderer process
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

/**
 * Electron 'ready' イベント。
 * アプリ準備完了時にメイン画面を生成。
 */
app.on('ready', async () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.ready'):0;
	createWindow();
});

// アプリケーションがアクティブになった時の処理
// （Macだと、Dockがクリックされた時）
/**
 * Electron 'activate' イベント（主にMac）。
 * ウィンドウが無ければ再作成。
 */
app.on("activate", () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.active'):0;
	// メインウィンドウが消えている場合は再度メインウィンドウを作成する
	if (mainWindow === null) {
		createWindow();
	}
});

// window全部閉じたらappも終了する
/**
 * 全ウィンドウが閉じられたときの終了処理。
 * 計測タスク停止、EL解放、アプリ終了。
 */
app.on('window-all-closed', async () => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.app.on.window-all-closed'):0;
	if( drawTimer ) { clearInterval(drawTimer); drawTimer = null; }
	await mainEL.endMeasureElectricEnegy();
	await EL.release();
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


/**
 * アプリケーションメニューを初期化する。
 * @returns {void}
 */
function menuInitialize() {
	let menu = Menu.buildFromTemplate(menuItems);
	Menu.setApplicationMenu(menu);
	mainWindow.setMenu(menu);
}


// IPC通信の定式
/**
 * レンダラープロセスへIPCメッセージを送信。
 * @param {string} cmdStr - コマンド文字列（例: 'draw'）
 * @param {*} argStr - 引数（オブジェクト等）
 * @returns {void}
 */
let sendIPCMessage = function( cmdStr, argStr ) {
	if( mainWindow != null && mainWindow.webContents != null ) {
		mainWindow.webContents.send('to-renderer', JSON.stringify({ cmd: cmdStr, arg: argStr} ) );
	}
};


// About this
/**
 * アプリ情報ダイアログを表示する。
 * @returns {void}
 */
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
