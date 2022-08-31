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
const appname  = 'OmronEnvStore';
const appDir   = process.env.NODE_ENV === 'development' ? __dirname : __dirname;
const isWin    = process.platform == "win32" ? true : false;
const isMac    = process.platform == "darwin" ? true : false;
const userHome = process.env[ isWin ? "USERPROFILE" : "HOME"];
const isDevelopment = process.env.NODE_ENV == 'development'


//////////////////////////////////////////////////////////////////////
// 追加ライブラリ
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const Store = require('electron-store');
const { sqlite3, omronModel } = require('./models/localDBModels');   // DBデータと連携
const { Op } = require("sequelize");

const omron = require('usb-2jcie-bu');
const cron = require('node-cron');
require('date-utils');


// electron設定とmain window
app.disableHardwareAcceleration();
let mainWindow = null;


// アプリのconfig
let config = {
	debug: true
};


//////////////////////////////////////////////////////////////////////
// ECHONET Lite管理
let ELStart = function() {
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| ELStart()'):0;

	if( config.EL.enabled == false ) {
		config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| ELStart() EL is desabled.'):0;
		return;
	}

	// mainEL初期設定
	mainEL.start( {network: config.network, EL: config.EL},
				  (rinfo, els, err) => {  // els received, 受信のたびに呼ばれる
					  // database
					  // 確認
					  let rawdata = mainEL.api.getSeparatedString_ELDATA(els);

					  mainEL.conv.elsAnarysis(els, function( eljson ) {
						  for (const [key, value] of Object.entries(eljson.EDT) )
						  {
							  eldataModel.create({ srcip: rinfo.address, srcmac:mainArp.toMAC(rinfo.address), seoj: eljson.SEOJ, deoj: eljson.DEOJ, esv: eljson.ESV, epc: key, edt: value });
						  }
					  } );
					  elrawModel.create({ srcip: rinfo.address, srcmac:mainArp.toMAC(rinfo.address), dstip:localaddresses[0], dstmac:mainArp.toMAC(localaddresses[0]), rawdata: rawdata, seoj: els.SEOJ, deoj: els.DEOJ, esv: els.ESV, opc: els.OPC, detail: els.DETAIL });
				  },
				  (facilities) => {  // change facilities, 全体監視して変更があったときに全体データとして呼ばれる
					  persist.elData = facilities;
					  config.EL.observationDevs = mainEL.observationDevs;
					  mainEL.conv.refer( objectSort(facilities) , function (devs) {
						  sendIPCMessage( "fclEL", objectSort(devs) );
					  });
				  });
};

//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
// IPC 受信から非同期で実行
ipcMain.on('to-main', function (event, arg) {
	// メッセージが来たとき
	config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already'):0;

	let c = JSON.parse(arg);

	switch (c.cmd) {
		default:
		config.debug?console.log( new Date().toFormat("YYYY-MM-DDTHH24:MI:SS"), '| main.ipcMain <- already'):0;
		break;
	}
});


ipcMain.handle( 'already', async (event, arg) => {
	console.log('already', arg);
	omronStart();
});


//////////////////////////////////////////////////////////////////////
// foreground
// ここがEntrypointと考えても良い
async function createWindow() {
	// 何はともあれDBの準備，SQLite の初期化の完了を待つ
	await sqlite3.sync().then(() => console.log("Local DB is ready."));

	// 画面の起動
	mainWindow = new BrowserWindow({
		width: store.get('window.width'),
		height: store.get('window.height'),
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
		console.log('# close');
		await writeConfigFile();
	});

	// window closeした後にひっかけて直後処理
	mainWindow.on('closed', async () => {
		console.log( '# closed' );
		mainWindow = null;
	});
};

app.on('ready', async () => {
	console.log('# ready');
	await readConfigFile();
	createWindow();
});

// アプリケーションがアクティブになった時の処理
// （Macだと、Dockがクリックされた時）
app.on("activate", () => {
	console.log('# activate');
	// メインウィンドウが消えている場合は再度メインウィンドウを作成する
	if (mainWindow === null) {
		createWindow();
	}
});

// window全部閉じたらappも終了する
app.on('window-all-closed', async () => {
	console.log('# window-all-close');
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
