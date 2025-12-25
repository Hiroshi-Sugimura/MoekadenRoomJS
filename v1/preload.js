//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.09.05 (MIT License)
//	Based on OWADA Shigeru 2020.12.24 (MIT License)
//////////////////////////////////////////////////////////////////////
'use strict'

const { contextBridge, ipcRenderer } = require('electron');

/**
 * レンダラーに公開するIPCブリッジ。安全なチャネルでmainとやり取りする。
 * @namespace ipc
 */

contextBridge.exposeInMainWorld('ipc', {
	//======================================================
	// renderer to main
	// rendererが準備できた
	/**
	 * レンダラー初期化完了をmainへ通知し、初期状態を受け取る。
	 * @returns {Promise<any>} mainの'already'ハンドラ結果
	 */
	already: async () => {
		return await ipcRenderer.invoke('already');
	},

	//======================================================
	// main to renderer
	/**
	 * mainからのイベント購読。指定チャネルで受信したらコールバック呼び出し。
	 * @param {string} channel - チャネル名
	 * @param {function} callback - (channel, args) を受け取る関数
	 */
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
	/** 施錠要求をmainへ送る */
	Lockkey:() => {
		console.log( 'Lockkey' );
		ipcRenderer.invoke('Lockkey');
	},

	/** 解錠要求をmainへ送る */
	Unlockkey:() => {
		console.log( 'Unlockkey' );
		ipcRenderer.invoke('Unlockkey');
	},

	// カーテン
	/** カーテンを閉じる要求をmainへ送る */
	Closecurtain:() => {
		console.log( 'Closecurtain' );
		ipcRenderer.invoke('Closecurtain');
	},

	/** カーテンを開く要求をmainへ送る */
	Opencurtain:() => {
		console.log( 'Opencurtain' );
		ipcRenderer.invoke('Opencurtain');
	},

	// ライト
	/** ライトを消灯する要求をmainへ送る */
	Offlight:() => {
		console.log( 'Offlight' );
		ipcRenderer.invoke('Offlight');
	},

	/** ライトを点灯する要求をmainへ送る */
	Onlight:() => {
		console.log( 'Onlight' );
		ipcRenderer.invoke('Onlight');
	},

	// 温度計
	/** 温度計を+1する要求をmainへ送る */
	Uptemperature:() => {
		console.log( 'Uptemperature' );
		ipcRenderer.invoke('Uptemperature');
	},

	/** 温度計を-1する要求をmainへ送る */
	Downtemperature:() => {
		console.log( 'Downtemperature' );
		ipcRenderer.invoke('Downtemperature');
	},

	// エアコン上段
	/** エアコン停止要求 */
	Offaircon:() => {
		console.log( 'Offaircon' );
		ipcRenderer.invoke('Offaircon');
	},

	/** エアコン開始要求 */
	Onaircon:() => {
		console.log( 'Onaircon' );
		ipcRenderer.invoke('Onaircon');
	},

	/** 設定温度を+1 */
	Upaircon:() => {
		console.log( 'Upaircon' );
		ipcRenderer.invoke('Upaircon');
	},

	/** 設定温度を-1 */
	Downaircon:() => {
		console.log( 'Downaircon' );
		ipcRenderer.invoke('Downaircon');
	},


	// エアコン下段
	/** エアコンを自動モードにする */
	Autoaircon:() => {
		console.log( 'Autoaircon' );
		ipcRenderer.invoke('Autoaircon');
	},

	/** 冷房モードにする */
	Coolaircon:() => {
		console.log( 'Coolaircon' );
		ipcRenderer.invoke('Coolaircon');
	},

	/** 暖房モードにする */
	Heataircon:() => {
		console.log( 'Heataircon' );
		ipcRenderer.invoke('Heataircon');
	},

	/** 除湿モードにする */
	Dryaircon:() => {
		console.log( 'Dryaircon' );
		ipcRenderer.invoke('Dryaircon');
	},

	/** 送風モードにする */
	Windaircon:() => {
		console.log( 'Windaircon' );
		ipcRenderer.invoke('Windaircon');
	}

});
