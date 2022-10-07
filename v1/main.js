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

function sendDevState() {
	// 機器の状態変化があれば画面に反映
	sendIPCMessage( 'draw', {
		aircon: mainEL.devState['013001'],
		light: mainEL.devState['029001'],
		curtain: mainEL.devState['026001'],
		lock: mainEL.devState['026f01'],
		thermometer: mainEL.devState['001101'],
		smartmeter: mainEL.devState['028801']
	} );
}



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
ipcMain.handle( 'already', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already, mainEL.devState:', mainEL.devState):0;

	// 一旦初期値を送る
	sendDevState();
	ELStart();
});


// GUIのボタン処理
// 鍵, 026f
ipcMain.handle( 'Lockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Lockkey'):0;


	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '41');

	mainEL.devState['026f01']['e0'] = [0x41]; // Locked
	sendDevState();
});

ipcMain.handle( 'Unlockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Unlockkey'):0;

	EL.sendOPC1(EL.EL_Multi, '026f01', '05ff01', '73', 'e0', '42');
	mainEL.devState['026f01']['e0'] = [0x42];  // Unlocked
	sendDevState();
});


// カーテン, 0260
ipcMain.handle( 'Closecurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Closecurtain'):0;

	mainEL.devState['026001']['e0'] = [0x42];  // Close
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', mainEL.devState['026001']['e0']);
});

ipcMain.handle( 'Opencurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Opencurtain'):0;

	mainEL.devState['026001']['e0'] = [0x41];  // Open
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '026001', '05ff01', '73', 'e0', mainEL.devState['026001']['e0']);
});

// ライト, 0290
ipcMain.handle( 'Onlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onlight'):0;

	mainEL.devState['029001']['80'] = [0x30];  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', mainEL.devState['029001']['80'] );
});

ipcMain.handle( 'Offlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offlight'):0;

	mainEL.devState['029001']['80'] = [0x31];  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '029001', '05ff01', '73', '80', mainEL.devState['029001']['80']);
});

// 温度計, 0011
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
ipcMain.handle( 'Onaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onaircon'):0;

	mainEL.devState['013001']['80'] = [0x30];  // On
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', mainEL.devState['013001']['80']);
});

ipcMain.handle( 'Offaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offaircon'):0;

	mainEL.devState['013001']['80'] = [0x31];  // Off
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', '80', mainEL.devState['013001']['80']);
});

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

ipcMain.handle( 'Downaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downaircon'):0;

	let temp = mainEL.devState['013001']['b3'][0];

	temp -= 1;
	if( temp < 0 ) { temp = 0; }

	mainEL.devState['013001']['b3'] = [temp];

	sendDevState();
});

// エアコン下段
ipcMain.handle( 'Autoaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Autoaircon'):0;

	mainEL.devState['013001']['b0'] = [0x41];  // auto
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

ipcMain.handle( 'Coolaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Coolaircon'):0;

	mainEL.devState['013001']['b0'] = [0x42];  // cool
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

ipcMain.handle( 'Heataircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Heataircon'):0;

	mainEL.devState['013001']['b0'] = [0x43];  // heat
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

ipcMain.handle( 'Dryaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Dryaircon'):0;

	mainEL.devState['013001']['b0'] = [0x44];  // dry
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
});

ipcMain.handle( 'Windaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Windaircon'):0;

	mainEL.devState['013001']['b0'] = [0x45];  // wind
	sendDevState();
	EL.sendOPC1(EL.EL_Multi, '013001', '05ff01', '73', 'b0', mainEL.devState['013001']['b0']);
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
