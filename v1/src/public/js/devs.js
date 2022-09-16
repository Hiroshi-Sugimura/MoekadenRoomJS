//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.08.31.
//////////////////////////////////////////////////////////////////////
'use strict'

////////////////////////////////////////////////////////////////////////////////
// デバイス関連の設定

let devs = {
	img_loadedNum: 0,
	IMG_LOADED_MAX: 15,  // 画像ロードの待機管理

	// デバイス系画像
	IMG: {},

	//////////////////////////////////////////////////////////////////
	// GUIのボタン処理
	// 鍵
	btnLockkey: document.getElementById('btnLockkey'),
	btnUnlockkey: document.getElementById('btnUnlockkey'),

	// カーテン
	btnOpencurtain: document.getElementById('btnOpencurtain'),
	btnClosecurtain: document.getElementById('btnClosecurtain'),

	// ライト
	btnOnlight: document.getElementById('btnOnlight'),
	btnOfflight: document.getElementById('btnOfflight'),

	// 温度計
	btnUptemperature: document.getElementById('btnUptemperature'),
	btnDowntemperature: document.getElementById('btnDowntemperature'),

	// エアコン上段
	btnOnaircon: document.getElementById('btnOnaircon'),
	btnOffaircon: document.getElementById('btnOffaircon'),
	btnUpaircon: document.getElementById('btnUpaircon'),
	btnDownaircon: document.getElementById('btnDownaircon'),

	// エアコン下段
	btnAutoaircon: document.getElementById('btnAutoaircon'),
	btnCoolaircon: document.getElementById('btnCoolaircon'),
	btnHeataircon: document.getElementById('btnHeataircon'),
	btnDryaircon: document.getElementById('btnDryaircon'),
	btnWindaircon: document.getElementById('btnWindaircon'),


	////////////////////////////////////////////////////////////////////////////////
	// index.jsのsetupから呼ばれる、ロードが終わったことをcallbackで伝える
	setup: function ( cb ) {
		// console.log('dev.setup()');
		devs.IMG.AIRCON_BACK = new Image(); devs.IMG.AIRCON_BACK.src  = './img/Devices.AirCon.On.AirconImage.Glow.png';
		devs.IMG.AIRCON_ON  = new Image(); devs.IMG.AIRCON_ON.src  = './img/Devices.AirCon.On.AirconImage.Body.On.png';
		devs.IMG.AIRCON_OFF = new Image(); devs.IMG.AIRCON_OFF.src = './img/Devices.AirCon.On.AirconImage.Body.Off.png';
		devs.IMG.AIRCON_AUTO = new Image(); devs.IMG.AIRCON_AUTO.src = './img/Devices.AirCon.On.AirconImage.Wind.Cool.png';
		devs.IMG.AIRCON_COOL = new Image(); devs.IMG.AIRCON_COOL.src = './img/Devices.AirCon.On.AirconImage.Wind.Cool.png';
		devs.IMG.AIRCON_HEAT = new Image(); devs.IMG.AIRCON_HEAT.src = './img/Devices.AirCon.On.AirconImage.Wind.Hot.png';
		devs.IMG.AIRCON_DRY = new Image(); devs.IMG.AIRCON_DRY.src = './img/Devices.AirCon.On.AirconImage.Wind.Wind.png';
		devs.IMG.AIRCON_WIND = new Image(); devs.IMG.AIRCON_WIND.src = './img/Devices.AirCon.On.AirconImage.Wind.Dry.png';
		devs.IMG.LIGHT_ON  = new Image(); devs.IMG.LIGHT_ON.src  = './img/Devices.FloorLight.On.LightPower.On.png';
		devs.IMG.LIGHT_OFF = new Image(); devs.IMG.LIGHT_OFF.src = './img/Devices.FloorLight.On.LightPower.Off.png';
		devs.IMG.CURTAIN_OPEN   = new Image(); devs.IMG.CURTAIN_OPEN.src  = './img/Devices.Curtain.On.Open.png';
		devs.IMG.CURTAIN_CLOSE  = new Image(); devs.IMG.CURTAIN_CLOSE.src = './img/Devices.Curtain.On.Close.png';
		devs.IMG.TERMOMETER_LOW = new Image(); devs.IMG.TERMOMETER_LOW.src = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Low.png';
		devs.IMG.TERMOMETER_MID = new Image(); devs.IMG.TERMOMETER_MID.src = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Mid.png';
		devs.IMG.TERMOMETER_HI  = new Image(); devs.IMG.TERMOMETER_HI.src  = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Hi.png';


		devs.IMG.AIRCON_BACK.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_ON.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_OFF.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_AUTO.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_COOL.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_HEAT.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_DRY.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_WIND.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.LIGHT_ON.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.LIGHT_OFF.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.CURTAIN_OPEN.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.CURTAIN_CLOSE.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.TERMOMETER_LOW.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.TERMOMETER_MID.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.TERMOMETER_HI.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
	},



	////////////////////////////////////////////////////////////////////////////////
	// 描画

	// エアコン描画
	drawAircon: function (ctx, state) {
		ctx.drawImage( devs.IMG.AIRCON_BACK, 567, 0 );

		switch( state['80'][0] ) {
			case 0x31:  // off
			ctx.drawImage( devs.IMG.AIRCON_OFF, 575, 2 );
			if( btnOnaircon.classList.contains('selected') ) {
				btnOnaircon.classList.remove('selected');
			}
			if( !btnOffaircon.classList.contains('selected') ) {
				btnOffaircon.classList.add('selected');
			}
			break;

			case 0x30:  // on
			ctx.drawImage( devs.IMG.AIRCON_ON, 575, 2 );
			if( !btnOnaircon.classList.contains('selected') ) {
				btnOnaircon.classList.add('selected');
			}
			if( btnOffaircon.classList.contains('selected') ) {
				btnOffaircon.classList.remove('selected');
			}

			switch( state['b0'][0] ) {
				case 0x41: // auto
				ctx.drawImage( devs.IMG.AIRCON_AUTO, 551, 63 );
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
				break;

				case 0x42: // cool
				ctx.drawImage( devs.IMG.AIRCON_COOL, 551, 63 );
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
				break;

				case 0x43:  // heat
				ctx.drawImage( devs.IMG.AIRCON_HEAT, 556, 63 );
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
				break;

				case 0x44: // dry
				ctx.drawImage( devs.IMG.AIRCON_DRY, 571, 66 );
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
				break;

				case 0x45: // wind
				ctx.drawImage( devs.IMG.AIRCON_WIND, 571, 66 );
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
				break;

				default:
				console.error('devs.draw() aircon unknown state:', state);
				break;
			}
			break;

			default:
			console.error('devs.draw() unknown state:', state);
			break;
		}


		let temp = parseInt( state['b3'], 16 );
		ctx.fillText( temp + " ℃", 655, 25);
	},

	// ライト描画
	drawLight: function (ctx, state) {
		switch( state['80'][0] ) {
			case 0x30:  // ON
			ctx.drawImage( devs.IMG.LIGHT_ON, 47, 84 );
			if( !btnOnlight.classList.contains('selected') ) {
				btnOnlight.classList.add('selected');
			}
			if( btnOfflight.classList.contains('selected') ) {
				btnOfflight.classList.remove('selected');
			}
			break;

			case 0x31: // OFF
			ctx.drawImage( devs.IMG.LIGHT_OFF, 47, 84 );
			if( btnOnlight.classList.contains('selected') ) {
				btnOnlight.classList.remove('selected');
			}
			if( !btnOfflight.classList.contains('selected') ) {
				btnOfflight.classList.add('selected');
			}
			break;

			default:
			console.error('devs.draw() lighting unknown state:', state);
			break;
		}
	},

	// カーテン描画
	drawCurtain: function (ctx, state) {
		switch( state['e0'][0] ) {
			case 0x41: // open
			ctx.drawImage( devs.IMG.CURTAIN_OPEN, 244, 30 );
			if( !btnOpencurtain.classList.contains('selected') ) {
				btnOpencurtain.classList.add('selected');
			}
			if( btnClosecurtain.classList.contains('selected') ) {
				btnClosecurtain.classList.remove('selected');
			}
			break;

			case 0x42:  // close
			ctx.drawImage( devs.IMG.CURTAIN_CLOSE, 256, 37 );
			if( btnOpencurtain.classList.contains('selected') ) {
				btnOpencurtain.classList.remove('selected');
			}
			if( !btnClosecurtain.classList.contains('selected') ) {
				btnClosecurtain.classList.add('selected');
			}
			break;

			default:
			console.error('devs.draw() curtain unknown state:', state);
			break;
		}
	},

	// 鍵描画
	drawLock: function (ctx, state) {
		switch( state['e0'][0] ) {
			case 0x41:  // Locked
			if( !btnLockkey.classList.contains('selected') ) {
				btnLockkey.classList.add('selected');
			}
			if( btnUnlockkey.classList.contains('selected') ) {
				btnUnlockkey.classList.remove('selected');
			}
			break;

			case 0x42: // Unlocked
			if( btnLockkey.classList.contains('selected') ) {
				btnLockkey.classList.remove('selected');
			}
			if( !btnUnlockkey.classList.contains('selected') ) {
				btnUnlockkey.classList.add('selected');
			}
			break;

			default:
			console.error('devs.draw() key unknown state:', state);
			break;
		}
	},

	// 温度計描画
	drawThermometer: function (ctx, state) {
		console.log( 'drawThermometer', state );
		let temp = state['e0'][0] * 256 + state['e0'][1];
		temp *= 0.1;

		ctx.fillText( temp + " ℃", 160, 40);

		// let temp = state['e0'];
		if( temp < 20 ) {  // low
			ctx.drawImage( devs.IMG.TERMOMETER_LOW, 167, 49 );
		}else if( temp < 26 ) { // mid
			ctx.drawImage( devs.IMG.TERMOMETER_MID, 167, 49 );
		}else{  // high
			ctx.drawImage( devs.IMG.TERMOMETER_HI, 167, 49 );
		}
	},

	// スマメ描画
	drawSmartmeter: function (ctx, state) {
	},


	//------------------------------------------------------
	// デバイスを描画する
	draw: function( ctx, state ) {
		if( devs.img_loadedNum < devs.IMG_LOADED_MAX ) return; // まだ全画像をロードできてないので描画しない

		console.log('devs.draw() state:', state);

		state.aircon? devs.drawAircon( ctx, state.aircon ):0;
		state.light? devs.drawLight( ctx, state.light ):0;
		state.curtain? devs.drawCurtain( ctx, state.curtain ):0;
		state.lock? devs.drawLock( ctx, state.lock ):0;
		state.thermometer? devs.drawThermometer( ctx, state.thermometer ):0;
		state.smartmeter? devs.drawSmartmeter( ctx, state.smartmeter ):0;
	}

};

