//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.08.31.
//////////////////////////////////////////////////////////////////////
'use strict'

////////////////////////////////////////////////////////////////////////////////
// 内部

////////////////////////////////////////////////////////////////////////////////
// HTMLがロードされたら実行，EventListenerとしてはDOMContentLoadedのあとloadする。
// このシステムとしてはindex.jsが最後実行してほしいのでloadとし、
// 他のサブモジュールをDOMContentLoadedにする
window.addEventListener('load', onLoad);

function onLoad() {
	console.log('## onLoad index.js');

	// 内部変数
	// デバイスの状態管理
	let _alreadySignal = false;

	// HTML内部とリンク，タブ制御


	//////////////////////////////////////////////////////////////////
	// canvas関係
	let can = document.getElementById('canvas');
	let ctx = can.getContext('2d');

	let img_loadedNum = 0;
	let IMG_LOADED_MAX = 11;  // 画像ロードの管理

	// 固定/背景画像
	let IMG_EXTERIOR_WEATHER_SUNNY = new Image();		IMG_EXTERIOR_WEATHER_SUNNY.src = './img/ExteriorWeather.Sunny.png';
	let IMG_ROOM	= new Image();		IMG_ROOM.src = './img/Background.png';
	let IMG_COUCH	= new Image();		IMG_COUCH.src = './img/Items.Couch.png';
	let IMG_PLANT	= new Image();		IMG_PLANT.src = './img/Items.Plant.png';
	let IMG_TV		= new Image();		IMG_TV.src	 = './img/Items.TV.On.Body.png';
	let IMG_TV_SCREEN_ON = new Image();	 IMG_TV_SCREEN_ON.src	 = './img/Items.TV.On.TVScreen.On.png';
	let IMG_TV_SCREEN_OFF = new Image(); IMG_TV_SCREEN_OFF.src	 = './img/Items.TV.On.TVScreen.Off.png';
	let IMG_SHELF	= new Image();		IMG_SHELF.src = './img/Items.Shelf.png';
	let IMG_RED_CUSHION	= new Image();		IMG_RED_CUSHION.src = './img/Items.RedCushion.Base.png';
	let IMG_BLUE_CUSHION	= new Image();		IMG_BLUE_CUSHION.src = './img/Items.BlueCushion.Base.png';
	let IMG_BEAR_BASE	= new Image();		IMG_BEAR_BASE.src = './img/Items.Bear.Base.png';
	// デバイス関係の設定は devs.json に逃がした

	// 初回のセットアップ、画像ロード
	function setup() {
		console.log('setup()');
		IMG_EXTERIOR_WEATHER_SUNNY.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_ROOM.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_COUCH.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_PLANT.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_TV.onload    = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_TV_SCREEN_ON.onload    = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_TV_SCREEN_OFF.onload    = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_SHELF.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_RED_CUSHION.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_BLUE_CUSHION.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_BEAR_BASE.onload = () => { img_loadedNum += 1; alreadySignal(); };

		devs.setup( () => {
			console.log('dev.setup() callback()');
			alreadySignal();
		});
		return;
	};

	function alreadySignal() {
		// まだ全画像をロードできてないので描画しない
		if( img_loadedNum < IMG_LOADED_MAX ) return;
		if( devs.img_loadedNum < devs.IMG_LOADED_MAX ) return;

		console.log('alreadySignal() _alreadySignal:', _alreadySignal);

		if( !_alreadySignal ) {  // 最初の描画が終わったら準備完了としてmainが動く
			console.log('send already()');
			window.ipc.already();
			_alreadySignal = true;
			return;
		}
	};


	function draw( devState ) {
		console.log('draw() img_loadedNum:', img_loadedNum);

		if( img_loadedNum < IMG_LOADED_MAX ) return; // まだ全画像をロードできてないので描画しない

		ctx.drawImage( IMG_EXTERIOR_WEATHER_SUNNY, 255, 11 );
		ctx.drawImage( IMG_ROOM, 0, 0, IMG_ROOM.naturalWidth, IMG_ROOM.naturalHeight );
		ctx.drawImage( IMG_PLANT, 146, 175 );
		ctx.drawImage( IMG_COUCH, 0, 244 );
		ctx.drawImage( IMG_TV, 608, 165 );
		ctx.drawImage( IMG_TV_SCREEN_OFF, 617, 175 );
		ctx.drawImage( IMG_SHELF, 760, 289 );
		ctx.drawImage( IMG_BLUE_CUSHION, 45, 275 );
		ctx.drawImage( IMG_RED_CUSHION, 0, 315 );
		ctx.drawImage( IMG_BEAR_BASE, 768, 211 );

		devs.draw( ctx, devState );
	};



	//////////////////////////////////////////////////////////////////
	// MainProcessからのメッセージ振り分け
	window.ipc.on('to-renderer', (event, obj) => {
		// console.log( '->', obj );
		let c = JSON.parse(obj);    // val = {cmd, arg} の形式でくる

		switch (c.cmd) {
			//----------------------------------------------
			// EL関連
			case "draw":
			console.log( 'main -> draw:', c.arg );
			// window.renewFacilitiesEL( c.arg );
			draw( c.arg );
			break;

			//----------------------------------------------
			// HEMS-Logger全体
			case "myIPaddr":
			console.log( 'main -> myIPaddr:', c.arg );
			myIPaddr.innerHTML = 'My IP address list: ' + c.arg;
			break;

			default:
			console.log('main -> unknown cmd:', c.cmd, "arg:", c.arg);
			break;
		}

	});


	//////////////////////////////////////////////////////////////////////
	// ボタン

	// URLを外部ブラウザで開く
	window.URLopen = function( url ) {
		console.log( 'url:', url );
		window.ipc.URLopen( url );
	};

	// この関数の最後に呼ぶ
	setup();
};
