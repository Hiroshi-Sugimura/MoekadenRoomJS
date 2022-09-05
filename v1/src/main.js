//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2018.03.16
//  Last updated: 2021.09.25
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
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const cron = require('node-cron');
const mainEL = require('./mainEL');
require('date-utils');


// electron設定とmain window
app.disableHardwareAcceleration();
let mainWindow = null;


// アプリのconfig
let config = {
	width: 860,  // product, innerWidth:854 + 16
	height: 529,   // innerHight:480 + 59
	debug: true
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
		'80': '31',
		'b0': '42',
		'b3': '14'
	},
	'029001': {  // lighting
		'80': '31'
	},
	'026001': {  // blind = curtain
		'e0': '41'
	},
	'026f01': {  // electnic lock
		'e0': '41'
	},
	'001101': {  // thermometer
		'e0': ['00', 'dc']
	},
	'028801': {  // smart meter
		'e1': '02',
		'e7': '10'
	}
};

let ELStart = function() {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| ELStart()'):0;

	// mainEL初期設定
	mainEL.start( {network: config.network, EL: config.EL},
				  (rinfo, els, err) => {  // els received, 受信のたびに呼ばれる
					  config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ELStart():', els):0;


					  // 機器の状態変化があれば画面に反映
					  sendDevState();
				  },
				  (facilities) => {  // change facilities, 全体監視して変更があったときに全体データとして呼ばれる
					  // 特に何もしない
				  });
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


	mainEL.api.sendOPC1('224.0.23.0', '026f01', '05ff01', '73', 'e0', '41');

	devState['026f01']['e0'] = '41'; // Locked
	sendDevState();
});

ipcMain.handle( 'Unlockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Unlockkey'):0;

	mainEL.api.sendOPC1('224.0.23.0', '026f01', '05ff01', '73', 'e0', '42');
	devState['026f01']['e0'] = '42';  // Unlocked
	sendDevState();
});


// カーテン, 0260
ipcMain.handle( 'Closecurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Closecurtain'):0;

	devState['026001']['e0'] = '42';  // Close
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '026001', '05ff01', '73', 'e0', '42');
});

ipcMain.handle( 'Opencurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Opencurtain'):0;

	devState['026001']['e0'] = '41';  // Open
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '026001', '05ff01', '73', 'e0', '41');
});

// ライト, 0290
ipcMain.handle( 'Onlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onlight'):0;

	devState['029001']['80'] = '30';  // On
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '029001', '05ff01', '73', '80', '30');
});

ipcMain.handle( 'Offlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offlight'):0;

	devState['029001']['80'] = '31';  // Off
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '029001', '05ff01', '73', '80', '31');
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
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', '80', '30');
});

ipcMain.handle( 'Offaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offaircon'):0;

	devState['013001']['80'] = '31';  // Off
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', '80', '31');
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
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', 'b0', '41');
});

ipcMain.handle( 'Coolaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Coolaircon'):0;

	devState['013001']['b0'] = '42';  // cool
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', 'b0', '42');
});

ipcMain.handle( 'Heataircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Heataircon'):0;

	devState['013001']['b0'] = '43';  // heat
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', 'b0', '43');
});

ipcMain.handle( 'Dryaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Dryaircon'):0;

	devState['013001']['b0'] = '44';  // dry
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', 'b0', '44');
});

ipcMain.handle( 'Windaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Windaircon'):0;

	devState['013001']['b0'] = '45';  // wind
	sendDevState();
	mainEL.api.sendOPC1('224.0.23.0', '013001', '05ff01', '73', 'b0', '45');
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
	mainWindow.loadURL( path.join(__dirname, 'public', 'index.htm') );

	if (isDevelopment) { // 開発モードならDebugGUIひらく
		mainWindow.webContents.openDevTools()
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
	mainEL.api.release();
	app.quit();	// macだろうとプロセスはkillしちゃう
});

// menu
const menuItems = [{
	label: appname,
	submenu: [
		{
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
		}
		]
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


//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
