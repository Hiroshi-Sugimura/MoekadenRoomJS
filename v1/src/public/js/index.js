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
	let IMG_LOADED_MAX = 6;  // 画像ロードの管理

	// 固定/背景画像
	let IMG_BACK	= new Image();		IMG_BACK.src = './img/Background.png';
	let IMG_COUCH	= new Image();		IMG_COUCH.src = './img/Items.Couch.png';
	let IMG_PLANT	= new Image();		IMG_PLANT.src = './img/Items.Plant.png';
	let IMG_SHELF	= new Image();		IMG_SHELF.src = './img/Items.Shelf.png';
	let IMG_RED_CUSHION	= new Image();		IMG_RED_CUSHION.src = './img/Items.RedCushion.Base.png';
	let IMG_BLUE_CUSHION	= new Image();		IMG_BLUE_CUSHION.src = './img/Items.BlueCushion.Base.png';
	// デバイス関係の設定は devs.json に逃がした

	// 初回のセットアップ、画像ロード
	function setup() {
		console.log('setup()');
		IMG_BACK.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_COUCH.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_PLANT.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_SHELF.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_RED_CUSHION.onload = () => { img_loadedNum += 1; alreadySignal(); };
		IMG_BLUE_CUSHION.onload = () => { img_loadedNum += 1; alreadySignal(); };

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

		ctx.drawImage( IMG_BACK, 0, 0, IMG_BACK.naturalWidth, IMG_BACK.naturalHeight );
		ctx.drawImage( IMG_PLANT, 0, 0, IMG_PLANT.naturalWidth, IMG_PLANT.naturalHeight, 146, 175, IMG_PLANT.naturalWidth, IMG_PLANT.naturalHeight, );
		ctx.drawImage( IMG_COUCH, 0, 0, IMG_COUCH.naturalWidth, IMG_COUCH.naturalHeight, 0, 244, IMG_COUCH.naturalWidth, IMG_COUCH.naturalHeight, );
		ctx.drawImage( IMG_SHELF, 0, 0, IMG_SHELF.naturalWidth, IMG_SHELF.naturalHeight, 760, 289, IMG_SHELF.naturalWidth, IMG_SHELF.naturalHeight, );
		ctx.drawImage( IMG_BLUE_CUSHION, 0, 0, IMG_BLUE_CUSHION.naturalWidth, IMG_BLUE_CUSHION.naturalHeight, 45, 275, IMG_BLUE_CUSHION.naturalWidth, IMG_BLUE_CUSHION.naturalHeight, );
		ctx.drawImage( IMG_RED_CUSHION, 0, 0, IMG_RED_CUSHION.naturalWidth, IMG_RED_CUSHION.naturalHeight, 0, 315, IMG_RED_CUSHION.naturalWidth, IMG_RED_CUSHION.naturalHeight, );

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
