//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.06.07 (MIT License)
//	Based on Futomi HATANO 2021.11.11 (MIT License)
//	Last updated: 2022.06.07
//////////////////////////////////////////////////////////////////////
'use strict'

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
	//======================================================
	// renderer to main
	// rendererが準備できた
	already: async () => {
		ipcRenderer.invoke('already');
	},

	//======================================================
	// main to renderer
	on: ( channel, callback ) => {
		console.log( 'on', channel );
		ipcRenderer.on( channel, (event, args ) => {
			console.log( 'ipc.on', channel, args );
			callback( channel, args );
		});
	},

	//======================================================
	// renderer to main

	// GUIのボタン処理
	// 鍵
	Lockkey:() => {
		console.log( 'Lockkey' );
		ipcRenderer.invoke('Lockkey');
	},

	Unlockkey:() => {
		console.log( 'Unlockkey' );
		ipcRenderer.invoke('Unlockkey');
	},

	// カーテン
	Closecurtain:() => {
		console.log( 'Closecurtain' );
		ipcRenderer.invoke('Closecurtain');
	},

	Opencurtain:() => {
		console.log( 'Opencurtain' );
		ipcRenderer.invoke('Opencurtain');
	},

	// ライト
	Offlight:() => {
		console.log( 'Offlight' );
		ipcRenderer.invoke('Offlight');
	},

	Onlight:() => {
		console.log( 'Onilght' );
		ipcRenderer.invoke('Onlight');
	},

	// 温度計
	Uptemperature:() => {
		console.log( 'Uptemperature' );
		ipcRenderer.invoke('Uptemperature');
	},

	Downtemperature:() => {
		console.log( 'Downtemperature' );
		ipcRenderer.invoke('Downtemperature');
	},

	// エアコン上段
	Offaircon:() => {
		console.log( 'Offaircon' );
		ipcRenderer.invoke('Offaircon');
	},

	Onaircon:() => {
		console.log( 'Onaircon' );
		ipcRenderer.invoke('Onaircon');
	},

	Upaircon:() => {
		console.log( 'Upaircon' );
		ipcRenderer.invoke('Upaircon');
	},

	Downaircon:() => {
		console.log( 'Downaircon' );
		ipcRenderer.invoke('Downaircon');
	},


	// エアコン下段
	Autoaircon:() => {
		console.log( 'Autoaircon' );
		ipcRenderer.invoke('Autoaircon');
	},

	Coolaircon:() => {
		console.log( 'Coolaircon' );
		ipcRenderer.invoke('Coolaircon');
	},

	Heataircon:() => {
		console.log( 'Heataircon' );
		ipcRenderer.invoke('Heataircon');
	},

	Dryaircon:() => {
		console.log( 'Dryaircon' );
		ipcRenderer.invoke('Dryaircon');
	},

	Windaircon:() => {
		console.log( 'Windaircon' );
		ipcRenderer.invoke('Windaircon');
	}

});


