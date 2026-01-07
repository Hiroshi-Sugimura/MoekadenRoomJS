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

/**
 * ページロード完了時の初期化。画像ロード・デバイス初期化・描画ループ準備を行う。
 */
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
	/**
	 * 画像とデバイスの初期化。全て読み込み完了したらalreadySignal()でmainへ通知。
	 */
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

	/**
	 * 画像とデバイス準備が揃ったことを検知し、初回のみmainへ'already'送信。
	 */
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


	/**
	 * メイン描画関数。背景・家具・デバイス・スマートメーターを描画する。
	 * @param {object} devState - mainから受け取った機器状態
	 */
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

		// スマートメーター表示
		drawSmartMeterData( ctx, devState );
	};

	// スマートメーターグラフ描画用のキャッシュと更新管理
	let smartMeterDataCache = null;
	let smartMeterDataUpdateCountdown = 0;
	const SMART_METER_DATA_UPDATE_INTERVAL = 1;  // フレームごとに更新（リアルタイム）

	/**
	 * スマートメーターの累積ログから30分平均Wの配列を再構築する。
	 * @param {object} smartMeter - スマートメーター状態（cumLog, e1 等）
	 * @returns {{values:number[], maxVal:number}|null} グラフ用キャッシュ
	 */
	function rebuildSmartMeterCache( smartMeter ) {
		if( !smartMeter || !smartMeter.cumLog || smartMeter.cumLog.length < 2 ) return null;
		const unitPower = (smartMeter.e1 && smartMeter.e1.length > 0) ? smartMeter.e1[0] : 0x02;
		const cumUnit = Math.pow(10, (unitPower < 5 ? -unitPower : unitPower - 10));

		const values = [];
		let maxVal = 0;

		// cumLogは累積kWh(単位はe1)なので差分をとって30分平均電力(W)に換算
		for( let i = 1; i < smartMeter.cumLog.length; i++ ) {
			const prev = smartMeter.cumLog[i - 1];
			const cur = smartMeter.cumLog[i];
			if( prev < 0 || cur < 0 ) {
				values.push(-1);
				continue;
			}

			const deltaKWh = (cur - prev) * cumUnit;  // kWh
			const avgW = deltaKWh <= 0 ? 0 : Math.round(deltaKWh * 1000 * 2); // 30分なので2倍してW換算
			values.push(avgW);
			if( avgW > maxVal ) maxVal = avgW;
		}

		if( values.length === 0 ) return null;
		// 先頭の点をつなぐために頭に同じ値を入れる
		values.unshift(values[0]);
		maxVal = Math.max(maxVal, 1);
		return { values, maxVal };
	}

	/**
	 * スマートメーターのグラフ領域を描画。データなしでも枠を表示。
	 * @param {CanvasRenderingContext2D} ctx - 2Dコンテキスト
	 * @param {object} devState - 機器状態（smartmeter含む）
	 */
	function drawSmartMeterData( ctx, devState ) {
		// グラフエリアの描画（データ有無にかかわらず枠は出す）
		const sm_x = 10, sm_y = 400, sm_w = 300, sm_h = 70;
		ctx.fillStyle = 'rgba(0, 102, 153, 0.5)';
		ctx.fillRect( sm_x, sm_y, sm_w, sm_h );

		// キャッシュの初期化と定期更新
		if( smartMeterDataCache == null || --smartMeterDataUpdateCountdown < 0 ) {
			smartMeterDataUpdateCountdown = SMART_METER_DATA_UPDATE_INTERVAL;
			smartMeterDataCache = rebuildSmartMeterCache( devState.smartmeter );
		}

		if( !smartMeterDataCache ) {
			// データなしの場合は枠だけ残して終了
			ctx.fillStyle = '#FFFFFF';
			ctx.font = '13px Arial';
			ctx.fillText( 'Smart meter / waiting data...', 15, 415 );
			return;
		}

		const { values, maxVal } = smartMeterDataCache;
		const instW = (devState.smartmeter && devState.smartmeter.instantaneousPower) ? devState.smartmeter.instantaneousPower : 0;
		const scaledMax = Math.max(maxVal, instW);

		// 補助線（1日＝48スロットの区切り）
		ctx.strokeStyle = '#B4B4B4';
		ctx.lineWidth = 1;
		for( let i = 0; i < values.length; i++ ) {
			if( i > 0 && (i % 48) === 0 ) {
				const gx = sm_x + sm_w * i / values.length;
				ctx.beginPath();
				ctx.moveTo(gx, sm_y);
				ctx.lineTo(gx, sm_y + sm_h);
				ctx.stroke();
			}
		}

		// グラフ描画
		const sm_mul = (sm_h - 8) / (scaledMax || 1);
		let prev_x = sm_x;
		let prev_val = values[0];

		for( let i = 1; i < values.length; i++ ) {
			const cur_x = sm_x + sm_w * i / values.length;
			const cur_val = values[i];

			const py = sm_y + sm_h - Math.max(0, Math.min(prev_val, maxVal)) * sm_mul;
			const cy = sm_y + sm_h - Math.max(0, Math.min(cur_val, maxVal)) * sm_mul;

			ctx.beginPath();
			if( prev_val >= 0 && cur_val >= 0 ) {
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 2;
				ctx.moveTo(prev_x, py);
				ctx.lineTo(cur_x, cy);
				ctx.stroke();
			} else {
				ctx.strokeStyle = '#FF0000';
				ctx.lineWidth = 2;
				ctx.moveTo(prev_x, sm_y + sm_h - 1);
				ctx.lineTo(cur_x, sm_y + sm_h - 1);
				ctx.stroke();
			}

			prev_x = cur_x;
			prev_val = cur_val;
		}

		// 瞬時電力表示と凡例
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '13px Arial';
		if( devState.smartmeter ) {
			const instantaneousPower = devState.smartmeter.instantaneousPower || 0;
			ctx.fillText( 'Smart meter / Using ' + instantaneousPower + ' W', 15, 415 );
			ctx.fillText( 'Avg (30min) W', 15, 429 );
			ctx.fillText( 'Max ' + Math.max(maxVal, instantaneousPower) + ' W', 15, 443 );

			// 右端に瞬時電力のオーバレイ（現在値）
			const ox = sm_x + sm_w - 2;
			const oy = sm_y + sm_h - Math.max(0, Math.min(instantaneousPower, scaledMax)) * sm_mul;
			ctx.strokeStyle = '#FFD700';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(ox, sm_y + sm_h);
			ctx.lineTo(ox, oy);
			ctx.stroke();
		}
	}


	//////////////////////////////////////////////////////////////////
	// GUIのボタン処理
	// 鍵
	const btnLockkey = document.getElementById('btnLockkey');
	btnLockkey.addEventListener('click', btnLockkey_Click);
	const btnUnlockkey = document.getElementById('btnUnlockkey');
	btnUnlockkey.addEventListener('click', btnUnlockkey_Click);

	/** 鍵の施錠ボタン押下ハンドラ */
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

	/** 鍵の解錠ボタン押下ハンドラ */
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

	/** カーテンを閉じるボタン押下ハンドラ */
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

	/** カーテンを開くボタン押下ハンドラ */
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

	/** ライト消灯ボタン押下ハンドラ */
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

	/** ライト点灯ボタン押下ハンドラ */
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

	/** 温度計+1ボタン押下ハンドラ */
	function btnUptemperature_Click() {
		console.log( 'btnOfflight_Click' );
		window.ipc.Uptemperature();
	}

	/** 温度計-1ボタン押下ハンドラ */
	function btnDowntemperature_Click() {
		console.log( 'btnDowntemperature_Click' );

		window.ipc.Downtemperature();
	}



	// エアコン上段
	const btnOnaircon = document.getElementById('btnOnaircon');
	btnOnaircon.addEventListener('click', btnOnaircon_Click);
	const btnOffaircon = document.getElementById('btnOffaircon');
	btnOffaircon.addEventListener('click', btnOffaircon_Click);

	/** エアコン停止ボタン押下ハンドラ */
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

	/** エアコン開始ボタン押下ハンドラ */
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

	/** エアコン設定温度+1押下ハンドラ */
	function btnUpaircon_Click() {
		console.log( 'btnUpaircon_Click' );
		window.ipc.Upaircon();
	}

	/** エアコン設定温度-1押下ハンドラ */
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

	/** エアコン自動モードボタン押下ハンドラ */
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

	/** エアコン冷房モードボタン押下ハンドラ */
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

	/** エアコン暖房モードボタン押下ハンドラ */
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

	/** エアコン除湿モードボタン押下ハンドラ */
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


	/** エアコン送風モードボタン押下ハンドラ */
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
