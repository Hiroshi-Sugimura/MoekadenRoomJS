//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.08.31.
//////////////////////////////////////////////////////////////////////
'use strict'

////////////////////////////////////////////////////////////////////////////////
// デバイス関連の設定

let devs = {
	img_loadedNum: 0,
	IMG_LOADED_MAX: 9,  // 画像ロードの待機管理

	// デバイス系画像
	IMG: {},

	////////////////////////////////////////////////////////////////////////////////
	// index.jsのsetupから呼ばれる、ロードが終わったことをcallbackで伝える
	setup: function ( cb ) {
		// console.log('dev.setup()');
		devs.IMG.AIRCON_ON  = new Image(); devs.IMG.AIRCON_ON.src  = './img/Devices.AirCon.On.AirconImage.Body.On.png';
		devs.IMG.AIRCON_OFF = new Image(); devs.IMG.AIRCON_OFF.src = './img/Devices.AirCon.On.AirconImage.Body.Off.png';
		devs.IMG.LIGHT_ON  = new Image(); devs.IMG.LIGHT_ON.src  = './img/Devices.FloorLight.On.LightPower.On.png';
		devs.IMG.LIGHT_OFF = new Image(); devs.IMG.LIGHT_OFF.src = './img/Devices.FloorLight.On.LightPower.Off.png';
		devs.IMG.CURTAIN_OPEN   = new Image(); devs.IMG.CURTAIN_OPEN.src  = './img/Devices.Curtain.On.Open.png';
		devs.IMG.CURTAIN_CLOSE  = new Image(); devs.IMG.CURTAIN_CLOSE.src = './img/Devices.Curtain.On.Close.png';
		devs.IMG.TERMOMETER_LOW = new Image(); devs.IMG.TERMOMETER_LOW.src = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Low.png';
		devs.IMG.TERMOMETER_MID = new Image(); devs.IMG.TERMOMETER_MID.src = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Mid.png';
		devs.IMG.TERMOMETER_HI  = new Image(); devs.IMG.TERMOMETER_HI.src  = './img/Sensors.RoomTempSensor.On.RoomTempDisp.Hi.png';

		devs.IMG.AIRCON_ON.onload  = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_OFF.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
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
		switch( state['80'] ) {
			case '31':
			ctx.drawImage( devs.IMG.AIRCON_OFF, 575, 2 );
			break;

			case '30':
			ctx.drawImage( devs.IMG.AIRCON_ON, 575, 2 );
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
		switch( state['80'] ) {
			case '31':
			ctx.drawImage( devs.IMG.LIGHT_OFF, 47, 84 );
			break;

			case '30':
			ctx.drawImage( devs.IMG.LIGHT_ON, 47, 84 );
			break;

			default:
			console.error('devs.draw() unknown state:', state);
			break;
		}
	},

	// カーテン描画
	drawCurtain: function (ctx, state) {
		switch( state['e0'] ) {
			case '41':
			ctx.drawImage( devs.IMG.CURTAIN_OPEN, 244, 30 );
			break;

			case '42':
			ctx.drawImage( devs.IMG.CURTAIN_CLOSE, 256, 37 );
			break;

			default:
			console.error('devs.draw() unknown state:', state);
			break;
		}
	},

	// 鍵描画
	drawLock: function (ctx, state) {
	},

	// 温度計描画
	drawThermometer: function (ctx, state) {
		console.log( 'drawThermometer', state );
		let temp = parseInt( state['e0'][0] + state['e0'][1], 16 );
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

