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
	// GUIのボタン処理
	// 鍵
	const btnLockkey = document.getElementById('btnLockkey');
	btnLockkey.addEventListener('click', btnLockkey_Click);
	const btnUnlockkey = document.getElementById('btnUnlockkey');
	btnUnlockkey.addEventListener('click', btnUnlockkey_Click);

	function btnLockkey_Click() {
		console.log( 'btnLockkey_Click' );
		if( btnUnlockkey.classList.contains('selected') ) {
			btnUnlockkey.classList.remove('selected')
		}

		if( !btnLockkey.classList.contains('selected') ) {
			btnLockkey.classList.add('selected')
		}

		window.ipc.Lockkey();
	}

	function btnUnlockkey_Click() {
		console.log( 'btnUnlockkey_Click' );
		if( btnLockkey.classList.contains('selected') ) {
			btnLockkey.classList.remove('selected')
		}
		if( !btnUnlockkey.classList.contains('selected') ) {
			btnUnlockkey.classList.add('selected')
		}

		window.ipc.Unlockkey();
	}


	// カーテン
	const btnOpencurtain = document.getElementById('btnOpencurtain');
	btnOpencurtain.addEventListener('click', btnOpencurtain_Click);
	const btnClosecurtain = document.getElementById('btnClosecurtain');
	btnClosecurtain.addEventListener('click', btnClosecurtain_Click);

	function btnClosecurtain_Click() {
		console.log( 'btnClosecurtain_Click' );
		if( btnOpencurtain.classList.contains('selected') ) {
			btnOpencurtain.classList.remove('selected')
		}

		if( !btnClosecurtain.classList.contains('selected') ) {
			btnClosecurtain.classList.add('selected')
		}

		window.ipc.Closecurtain();
	}

	function btnOpencurtain_Click() {
		console.log( 'btnOpencurtain_Click' );
		if( btnClosecurtain.classList.contains('selected') ) {
			btnClosecurtain.classList.remove('selected')
		}
		if( !btnOpencurtain.classList.contains('selected') ) {
			btnOpencurtain.classList.add('selected')
		}

		window.ipc.Opencurtain();
	}

	// ライト
	const btnOnlight = document.getElementById('btnOnlight');
	btnOnlight.addEventListener('click', btnOnlight_Click);
	const btnOfflight = document.getElementById('btnOfflight');
	btnOfflight.addEventListener('click', btnOfflight_Click);

	function btnOfflight_Click() {
		console.log( 'btnOfflight_Click' );
		if( btnOnlight.classList.contains('selected') ) {
			btnOnlight.classList.remove('selected')
		}

		if( !btnOfflight.classList.contains('selected') ) {
			btnOfflight.classList.add('selected')
		}

		window.ipc.Offlight();
	}

	function btnOnlight_Click() {
		console.log( 'btnOnilght_Click' );
		if( btnOfflight.classList.contains('selected') ) {
			btnOfflight.classList.remove('selected')
		}
		if( !btnOnlight.classList.contains('selected') ) {
			btnOnlight.classList.add('selected')
		}

		window.ipc.Onlight();
	}


	// 温度計
	const btnUptemperature = document.getElementById('btnUptemperature');
	btnUptemperature.addEventListener('click', btnUptemperature_Click);
	const btnDowntemperature = document.getElementById('btnDowntemperature');
	btnDowntemperature.addEventListener('click', btnDowntemperature_Click);

	function btnUptemperature_Click() {
		console.log( 'btnOfflight_Click' );
		window.ipc.Uptemperature();
	}

	function btnDowntemperature_Click() {
		console.log( 'btnDowntemperature_Click' );

		window.ipc.Downtemperature();
	}



	// エアコン上段
	const btnOnaircon = document.getElementById('btnOnaircon');
	btnOnaircon.addEventListener('click', btnOnaircon_Click);
	const btnOffaircon = document.getElementById('btnOffaircon');
	btnOffaircon.addEventListener('click', btnOffaircon_Click);

	function btnOffaircon_Click() {
		console.log( 'btnOffaircon_Click' );
		if( btnOnaircon.classList.contains('selected') ) {
			btnOnaircon.classList.remove('selected')
		}

		if( !btnOffaircon.classList.contains('selected') ) {
			btnOffaircon.classList.add('selected')
		}

		window.ipc.Offaircon();
	}

	function btnOnaircon_Click() {
		console.log( 'btnOnaircon_Click' );
		if( btnOffaircon.classList.contains('selected') ) {
			btnOffaircon.classList.remove('selected')
		}
		if( !btnOnaircon.classList.contains('selected') ) {
			btnOnaircon.classList.add('selected')
		}

		window.ipc.Onaircon();
	}

	const btnUpaircon = document.getElementById('btnUpaircon');
	btnUpaircon.addEventListener('click', btnUpaircon_Click);
	const btnDownaircon = document.getElementById('btnDownaircon');
	btnDownaircon.addEventListener('click', btnDownaircon_Click);

	function btnUpaircon_Click() {
		console.log( 'btnUpaircon_Click' );
		window.ipc.Upaircon();
	}

	function btnDownaircon_Click() {
		console.log( 'btnDownaircon_Click' );

		window.ipc.Downaircon();
	}



	// エアコン下段
	const btnAutoaircon = document.getElementById('btnAutoaircon');
	btnAutoaircon.addEventListener('click', btnAutoaircon_Click);
	const btnCoolaircon = document.getElementById('btnCoolaircon');
	btnCoolaircon.addEventListener('click', btnCoolaircon_Click);
	const btnHeataircon = document.getElementById('btnHeataircon');
	btnHeataircon.addEventListener('click', btnHeataircon_Click);
	const btnDryaircon = document.getElementById('btnDryaircon');
	btnDryaircon.addEventListener('click', btnDryaircon_Click);
	const btnWindaircon = document.getElementById('btnWindaircon');
	btnWindaircon.addEventListener('click', btnWindaircon_Click);

	function btnAutoaircon_Click() {
		console.log( 'btnAutoaircon_Click' );
		if( !btnAutoaircon.classList.contains('selected') ) {
			btnAutoaircon.classList.add('selected')
		}
		if( btnCoolaircon.classList.contains('selected') ) {
			btnCoolaircon.classList.remove('selected')
		}
		if( btnHeataircon.classList.contains('selected') ) {
			btnHeataircon.classList.remove('selected')
		}
		if( btnDryaircon.classList.contains('selected') ) {
			btnDryaircon.classList.remove('selected')
		}
		if( btnWindaircon.classList.contains('selected') ) {
			btnWindaircon.classList.remove('selected')
		}

		window.ipc.Autoaircon();

	}

	function btnCoolaircon_Click() {
		console.log( 'btnCoolaircon_Click' );
		if( btnAutoaircon.classList.contains('selected') ) {
			btnAutoaircon.classList.remove('selected')
		}
		if( !btnCoolaircon.classList.contains('selected') ) {
			btnCoolaircon.classList.add('selected')
		}
		if( btnHeataircon.classList.contains('selected') ) {
			btnHeataircon.classList.remove('selected')
		}
		if( btnDryaircon.classList.contains('selected') ) {
			btnDryaircon.classList.remove('selected')
		}
		if( btnWindaircon.classList.contains('selected') ) {
			btnWindaircon.classList.remove('selected')
		}

		window.ipc.Coolaircon();
	}

	function btnHeataircon_Click() {
		console.log( 'btnHeataircon_Click' );
		if( btnAutoaircon.classList.contains('selected') ) {
			btnAutoaircon.classList.remove('selected')
		}
		if( btnCoolaircon.classList.contains('selected') ) {
			btnCoolaircon.classList.remove('selected')
		}
		if( !btnHeataircon.classList.contains('selected') ) {
			btnHeataircon.classList.add('selected')
		}
		if( btnDryaircon.classList.contains('selected') ) {
			btnDryaircon.classList.remove('selected')
		}
		if( btnWindaircon.classList.contains('selected') ) {
			btnWindaircon.classList.remove('selected')
		}

		window.ipc.Heataircon();
	}

	function btnDryaircon_Click() {
		console.log( 'btnDryaircon_Click' );
		if( btnAutoaircon.classList.contains('selected') ) {
			btnAutoaircon.classList.remove('selected')
		}
		if( btnCoolaircon.classList.contains('selected') ) {
			btnCoolaircon.classList.remove('selected')
		}
		if( btnHeataircon.classList.contains('selected') ) {
			btnHeataircon.classList.remove('selected')
		}
		if( !btnDryaircon.classList.contains('selected') ) {
			btnDryaircon.classList.add('selected')
		}
		if( btnWindaircon.classList.contains('selected') ) {
			btnWindaircon.classList.remove('selected')
		}

		window.ipc.Dryaircon();
	}


	function btnWindaircon_Click() {
		console.log( 'btnWindaircon_Click' );
		if( btnAutoaircon.classList.contains('selected') ) {
			btnAutoaircon.classList.remove('selected')
		}
		if( btnCoolaircon.classList.contains('selected') ) {
			btnCoolaircon.classList.remove('selected')
		}
		if( btnHeataircon.classList.contains('selected') ) {
			btnHeataircon.classList.remove('selected')
		}
		if( btnDryaircon.classList.contains('selected') ) {
			btnDryaircon.classList.remove('selected')
		}
		if( !btnWindaircon.classList.contains('selected') ) {
			btnWindaircon.classList.add('selected')
		}

		window.ipc.Windaircon();
	}



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
