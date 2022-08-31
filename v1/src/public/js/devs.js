//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2022.08.31.
//////////////////////////////////////////////////////////////////////
'use strict'

////////////////////////////////////////////////////////////////////////////////
// デバイス関連の設定

let devs = {
	img_loadedNum: 0,
	IMG_LOADED_MAX: 6,  // 画像ロードの管理

	// デバイス系画像
	IMG: {},

	////////////////////////////////////////////////////////////////////////////////
	// index.jsのsetupから呼ばれる
	setup: function ( cb ) {
		// console.log('dev.setup()');
		devs.IMG.AIRCON_ON = new Image(); devs.IMG.AIRCON_ON.src = './img/Devices.AirCon.On.AirconImage.Body.On.png';
		devs.IMG.AIRCON_OFF = new Image(); devs.IMG.AIRCON_OFF.src = './img/Devices.AirCon.On.AirconImage.Body.Off.png';
		devs.IMG.LIGHT_ON  = new Image(); devs.IMG.LIGHT_ON.src = './img/Devices.FloorLight.On.LightPower.On.png';
		devs.IMG.LIGHT_OFF  = new Image(); devs.IMG.LIGHT_OFF.src = './img/Devices.FloorLight.On.LightPower.Off.png';
		devs.IMG.CURTAIN_OPEN  = new Image(); devs.IMG.CURTAIN_OPEN.src = './img/Devices.Curtain.On.Open.png';
		devs.IMG.CURTAIN_CLOSE  = new Image(); devs.IMG.CURTAIN_CLOSE.src = './img/Devices.Curtain.On.Close.png';

		devs.IMG.AIRCON_ON.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.AIRCON_OFF.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.LIGHT_ON.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.LIGHT_OFF.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.CURTAIN_OPEN.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
		devs.IMG.CURTAIN_CLOSE.onload = () => { devs.img_loadedNum += 1; devs.img_loadedNum < devs.IMG_LOADED_MAX ? 0:cb(); };
	},



	////////////////////////////////////////////////////////////////////////////////
	// 描画

	// div.draw()で使う内部関数
	drawObj: function( ctx, img, x, y ) {
		ctx.drawImage( img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, img.naturalWidth, img.naturalHeight, );
	},

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
			console.error('dev.draw() unknown state:', state);
			break;
		}
	},

	drawLight: function (ctx, state) {
		switch( state['80'] ) {
			case '31':
			ctx.drawImage( devs.IMG.LIGHT_OFF, 47, 84 );
			break;

			case '30':
			ctx.drawImage( devs.IMG.LIGHT_ON, 47, 84 );
			break;

			default:
			console.error('dev.draw() unknown state:', state);
			break;
		}
	},

	drawCurtain: function (ctx, state) {
		switch( state['e0'] ) {
			case '41':
			ctx.drawImage( devs.IMG.CURTAIN_OPEN, 244, 30 );
			break;

			case '42':
			ctx.drawImage( devs.IMG.CURTAIN_CLOSE, 256, 37 );
			break;

			default:
			console.error('dev.draw() unknown state:', state);
			break;
		}
	},

	drawLock: function (ctx, state) {
	},

	drawThermometer: function (ctx, state) {
	},

	drawSmartmeter: function (ctx, state) {
	},


	// デバイスを描画する
	draw: function( ctx, state ) {
		if( devs.img_loadedNum < devs.IMG_LOADED_MAX ) return; // まだ全画像をロードできてないので描画しない

		console.log('dev.draw() state:', state);

		devs.drawAircon( ctx, state.aircon );
		devs.drawLight( ctx, state.light );
		devs.drawCurtain( ctx, state.curtain );
		devs.drawLock( ctx, state.lock );
		devs.drawThermometer( ctx, state.thermometer );
		devs.drawSmartmeter( ctx, state.smartmeter );
	}

};

