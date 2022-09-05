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
// ECHONET Lite管理

let devState = {
	'013001': {  // aircon
		'80': '31',
		'b0': '42',
		'b3': '20'
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
		'e0': ['00', '220']
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
					  sendIPCMessage( 'draw', {
						  aircon: devState['013001'],
						  light: devState['029001'],
						  curtain: devState['026001'],
						  lock: devState['026f01'],
						  thermometer: devState['001101'],
						  smartmeter: devState['028801']
					  } );

				  },
				  (facilities) => {  // change facilities, 全体監視して変更があったときに全体データとして呼ばれる
					  // 特に何もしない
				  });
};



//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
ipcMain.handle( 'already', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already'):0;

	// 一旦初期値を送る
	sendIPCMessage( 'draw', {
		aircon: devState['013001'],
		light: devState['029001'],
		curtain: devState['026001'],
		lock: devState['026f01'],
		thermometer: devState['001101'],
		smartmeter: devState['028801']
	} );

	ELStart();
});


// GUIのボタン処理
// 鍵
ipcMain.handle( 'Lockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Lockkey'):0;

});

ipcMain.handle( 'Unlockkey', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Unlockkey'):0;

});


// カーテン
ipcMain.handle( 'Closecurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Closecurtain'):0;

});

ipcMain.handle( 'Opencurtain', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Opencurtain'):0;

});

// ライト
ipcMain.handle( 'Onlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onlight'):0;

});

ipcMain.handle( 'Offlight', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offlight'):0;

});

// 温度計
ipcMain.handle( 'Uptemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uptemperature'):0;

});

ipcMain.handle( 'Downtemperature', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downtemperature'):0;

});


// エアコン上段
ipcMain.handle( 'Onaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Onaircon'):0;

});

ipcMain.handle( 'Offaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Offaircon'):0;

});

ipcMain.handle( 'Upaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Uparicon'):0;

});

ipcMain.handle( 'Downaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Downaircon'):0;

});

// エアコン下段
ipcMain.handle( 'Autoaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Autoaircon'):0;

});

ipcMain.handle( 'Coolaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Coolaircon'):0;

});

ipcMain.handle( 'Heataircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Heataircon'):0;

});

ipcMain.handle( 'Dryaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Dryaircon'):0;

});

ipcMain.handle( 'Windaircon', async (event, arg) => {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- Windaircon'):0;

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
