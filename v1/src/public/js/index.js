//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2013.09.27.
//	Last updated: 2022.08.24
//////////////////////////////////////////////////////////////////////
'use strict'

////////////////////////////////////////////////////////////////////////////////
// 内部
function isObjEmpty(obj) {
	return Object.keys(obj).length === 0;
}


////////////////////////////////////////////////////////////////////////////////
// HTMLがロードされたら実行，EventListenerとしてはDOMContentLoadedのあとloadする。
// このシステムとしてはindex.jsが最後実行してほしいのでloadとし、
// 他のサブモジュールをDOMContentLoadedにする
window.addEventListener('load', onLoad);

function onLoad() {
	console.log('## onLoad index.js');

	// タブ制御
	let configTab  = document.getElementById('config');

	// 内部変数
	let config;        // コンフィグファイルの内容
	let halData;       // HALのデータ
	let halProfile;    // HALのプロファイル
	let facilitiesESM;  // スマメ情報

	// HTML内部とリンク，タブ制御
	let divHALhome      = document.getElementById('divHALhome');  // HALタブ連携してる，homeとinfoでAltする
	let divHALhome_info = document.getElementById('divHALhome_info');  // HALタブ連携無し


	// TOP
	let roomEnvTitle = document.getElementById('roomEnvTitle');  // 屋内環境 というH2タイトル

	// Questionnaire
	let btnQuestionnaireSubmit = document.getElementById('btnQuestionnaireSubmit');

	// config
	let inUserHeight     = document.getElementById('inUserHeight');  // 身長
	let inUserWeight     = document.getElementById('inUserWeight');  // 体重
	let btnWeightSet = document.getElementById('btnWeightSet');  // 身長・体重のセット

	let inHALApiKey = document.getElementById('inHALApiKey'); // HAL連携設定
	let divHALconfig       = document.getElementById('divHALconfig');
	let inEllogExpireDays  = document.getElementById('inEllogExpireDays');
	let inResultExpireDays = document.getElementById('inResultExpireDays');
	let inIPv4 = document.getElementById('inIPv4');
	let inIPv6 = document.getElementById('inIPv6');
	let divobservationInterval = document.getElementById('divobservationInterval');
	let divobservationDevs     = document.getElementById('divobservationDevs');

	let inESMUse      = document.getElementById('inESMUse'); // electric smart meter
	let inDongleType  = document.getElementById('inDongleType');
	let inESMId       = document.getElementById('inESMId');
	let inESMPassword = document.getElementById('inESMPassword');

	let huePushDialog = document.getElementById('huePushDialog');  // hue
	let inHueUse      = document.getElementById('inHueUse');
	let inHueKey      = document.getElementById('inHueKey');

	let configSaveBtn = document.getElementById('configSaveBtn');

	let owmHelpDialog        = document.getElementById('owmHelpDialog');
	let divWeatherConfigInfo = document.getElementById('divWeatherConfigInfo');  // open weather map
	let inOwmAPIKey          = document.getElementById('inOwmAPIKey');  // open weather map
	let inZipCode            = document.getElementById('inZipCode');

	let inNetatmoID   = document.getElementById('inNetatmoID');  // netatmo
	let inNetatmoSecret   = document.getElementById('inNetatmoSecret');
	let inNetatmoUsername = document.getElementById('inNetatmoUsername');
	let inNetatmoPassword = document.getElementById('inNetatmoPassword');

	let inOmronUse      = document.getElementById('inOmronUse'); // omron; use or not
	let inELUse      = document.getElementById('inELUse'); // omron; use or not


	// debug
	let myIPaddr = document.getElementById('myIPaddr');
	let txtErrLog = document.getElementById('txtErrLog');

	let syncBtn = document.getElementById('syncBtn');

	let getHalApiTokenCallback = () => { };
	let setHalApiTokenCallback = () => { };
	let getHalUserProfileCallback = () => { };



	//////////////////////////////////////////////////////////////////
	// MainProcessからのメッセージ振り分け
	window.ipc.on('to-renderer', (event, obj) => {
		// console.log( '->', obj );
		let c = JSON.parse(obj);    // val = {cmd, arg} の形式でくる

		switch (c.cmd) {
			//----------------------------------------------
			// HAL関連
			case "fclHAL": // HAL情報
			console.log( 'main -> fclHAL:', c.arg );
			renewHALcontents( c.arg );
			break;

			case "renewHAL": // HALのデータをもらった
			console.log( 'main -> renewHAL:', c.arg );
			halData = c.arg;
			window.renewHAL( halData.MajorResults, halData.MinorResults, halData.MinorkeyMeans);
			break;

			case "Synced": // 同期処理終了
			console.log( 'main -> Synced:' );
			if (c.arg.error) {
				alert(c.arg.error);
			}
			syncBtn.disabled = false;
			syncBtn.textContent = '同期開始';
			// 同期成功したなら最新のHALもらう
			window.ipc.HALrenew();
			break;

			case "HALgetApiTokenResponse": // HAL API トークン取得の応答
			console.log( 'main -> HALgetApiTokenResponse:', c.arg );
			getHalApiTokenCallback(c.arg);
			break;

			case "HALsetApiTokenResponse": // HAL API トークン設定の応答
			console.log( 'main -> HALsetApiTokenResponse:', c.arg );
			setHalApiTokenCallback(c.arg);
			break;

			case "HALdeleteApiTokenResponse": // HAL API トークン設定削除の応答
			console.log( 'main -> HALdeleteApiTokenResponse:', c.arg );
			deleteHalApiTokenCallback();
			break;

			case "HALgetUserProfileResponse": // HAL ユーザープロファイル取得の応答
			console.log( 'main -> HALgetUserProfileResponse:', c.arg );
			getHalUserProfileCallback(c.arg);
			break;

			case "HALsyncResponse":  // HAL同期の応答
			console.log( 'main -> HALsyncResponse:' );
			break;

			//----------------------------------------------
			// EL関連
			case "fclEL":
			console.log( 'main -> fclEL:', c.arg );
			window.renewFacilitiesEL( c.arg );
			break;

			//----------------------------------------------
			// 電力スマメ関連
			case "fclESM":
			console.log( 'main -> fclESM:', c.arg );
			// txtELLog.value = JSON.stringify(c.arg, null, '  ');
			facilitiesESM = c.arg; // 機器情報確保
			break;

			case "ESMLinked":
			console.log( 'main -> ESMLinked:' );
			window.addToast( 'Info', '電力スマートメータとLinkしました');
			break;

			//----------------------------------------------
			// Philips hue関連
			case "fclHue":
			console.log( 'main -> fclHue:', c.arg );
			window.renewHueLog( JSON.stringify(c.arg, null, '  ') );
			window.renewFacilitiesHue( c.arg );
			break;

			case "HueLinked": // HueとLinkできた
			console.log( 'main -> HueLinked:', c.arg );
			huePushDialog.close();
			inHueKey.value = c.arg;
			window.addToast( 'Info', 'HueとLinkしました');
			window.hueLinked();
			break;

			//----------------------------------------------
			// OpenWeatherMap関連
			case "renewOwm": // OpenWeatherMapのデータをもらった
			console.log( 'main -> renewOwm:', c.arg );
			window.renewOwm( c.arg );
			break;

			//----------------------------------------------
			// Netatmo関連
			case "renewNetatmo": // Netatmoのデータをもらった
			// console.log( 'main -> renewNetatmo:', c.arg );  // ログ多すぎる
			window.renewNetatmo( c.arg );
			break;

			//----------------------------------------------
			// Omron関連
			case "renewOmron": // Omronのデータをもらった
			// console.log( 'main -> renewOmron:', c.arg );  // ログ多過ぎるので必要な時だけ有効にする
			window.renewOmron(c.arg);
			break;

			case "omronDisconnected": // Omron切断
			console.log( 'main -> omronDisconnected:' );  // ログ多過ぎるので必要な時だけ有効にする
			window.disconnectedOmron();
			break;

			//----------------------------------------------
			// 部屋環境グラフ
			case "renewRoomEnvNetatmo":
			// console.log( 'main -> newRoomEnvNetatmo:', c.arg);   // ログ多すぎる
			window.renewRoomEnvNetatmo( c.arg );
			break;


			case "renewRoomEnvOmron":
			// console.log( 'main -> newRoomEnvOmron:', c.arg);   // ログ多すぎる
			window.renewRoomEnvOmron( c.arg );
			break;

			//----------------------------------------------
			// HEMS-Logger全体
			case "myIPaddr":
			console.log( 'main -> myIPaddr:', c.arg );
			myIPaddr.innerHTML = 'My IP address list: ' + c.arg;
			break;

			case "renewConfig":
			console.log('main -> renewConfig:', c.arg);
			renewConfig(c.arg);
			break;

			case "configSaved": // 設定保存の応答
			console.log( 'main -> configSaved:', c.arg );
			if (c.arg.error) {
				alert(c.arg.error);
			}
			configSaveBtn.disabled = false;
			configSaveBtn.textContent = '保存';
			// window.alert('設定を保存しました。');
			window.addToast( 'Info', '設定を保存しました。');
			break;

			case "Info":
			console.log( 'main -> Info:', c.arg );
			console.dir(c.arg);
			window.addToast( 'Info', c.arg );
			break;

			case "Error":
			console.log( 'main -> Error:', c.arg );
			window.addToast( 'Error', c.arg );
			// ESMのdongleがないときはcheckを外す
			inESMUse.checked = false;
			break;

			default:
			txtErrLog.value = JSON.stringify(c, null, '  ');
			console.log('main -> unknown cmd:', c.cmd, "arg:", c.arg);
			break;
		}
	});


	////////////////////////////////////////////////////////////////////////////////
	// HAL関係（HALタブとconfigタブのHAL連携部分）
	let renewHALcontents = async function ( HALtoken ) {
		console.log( 'renewHALcontents(): HALtoken: ', HALtoken );

		// 取得したトークンが有効かどうかを確認するために HAL ユーザープロファイルを取得
		if (HALtoken) {
			inHALApiKey.value = HALtoken;
			try {
				let profile = await getHalUserProfile();
				halProfile = profile;
				window.renewHALProfile(halProfile);
				console.log(JSON.stringify(profile, null, '  '));
				document.getElementById('hal-control-box').style.display = 'block';  // 同期ボタン表示
			} catch (error) {
				console.error( error );
				document.getElementById('setHalApiTokenErr').textContent = error.message;
			}
		}else{
			inHALApiKey.value = "";  // undefined がテキストボックスに表示されないように
		}

		if( HALtoken && HALtoken != 'null' && halProfile) {
			divHALconfig.innerHTML = ' \
			  <p><strong>連携設定完了しています。</strong><br> \
				HALと連携を解除するには登録解除ボタンを押してください。APIトークンは削除されますが、再度HALにログインして、Profileメニューから確認できます。<br> \
				<p><button type="button" id="deleteHalApiTokenBtn">登録解除</button></p> \
			  </form>';

			let deleteHalApiTokenBtn = document.getElementById('deleteHalApiTokenBtn');

			// HAL API トークン設定削除ボタンが押されたときの処理
			deleteHalApiTokenBtn.addEventListener('click', function () {
				window.ipc.HALdeleteApiToken();
			});

		}else{
			divHALconfig.innerHTML = ' \
			  <p><strong>連携設定がされていません。</strong><br> \
				HALと連携するには下記の事前準備の通りにAPIトークンを取得し、Key入力をして登録ください。<br> \
				<p id="setHalApiTokenErr" style="color:red;"></p> \
				<p><button type="button" id="setHalApiTokenBtn">登録</button></p> \
			  </form>';

			let setHalApiTokenBtn = document.getElementById('setHalApiTokenBtn');

			// HAL API トークン設定ボタンが押されたときの処理
			setHalApiTokenBtn.addEventListener('click', function () {
				let err_el = document.getElementById('setHalApiTokenErr');
				err_el.textContent = '';
				setHalApiTokenBtn.disabled = true;

				HALtoken = inHALApiKey.value;
				let err = '';
				if (!HALtoken) {
					err = 'API トークンを入力してください。';
				} else if (!/^[\x21-\x7e]+$/.test(HALtoken)) {
					err = 'API トークンに不適切な文字が含まれています。';
				}

				if (err) {
					err_el.textContent = err;
					setHalApiTokenBtn.disabled = false;
					return;
				}

				let HAL_REQUEST_TIMEOUT = 5000;

				let timer = setTimeout(() => {
					err_el.textContent = 'TIMEOUT: HAL の応答がありませんでした。';
					setHalApiTokenBtn.disabled = false;
					setHalApiTokenCallback = () => { };
				}, HAL_REQUEST_TIMEOUT);

				setHalApiTokenCallback = (res) => {
					if (timer) {
						clearTimeout(timer);
					}
					if (res.error) {
						err_el.textContent = res.error;
					} else {
						document.getElementById('hal-control-box').style.display = 'block';  // 同期ボタン表示
						window.addToast('Info', 'HAL 連携が成功しました。');
						configSave();

						// 同期もする
						syncBtn.disabled = true;
						syncBtn.textContent = '同期中…';
						window.ipc.HALsync();
						renewHALcontents(HALtoken);
					}
					setHalApiTokenBtn.disabled = false;
					setHalApiTokenCallback = () => { };
				};

				window.ipc.HALsetApiTokenRequest( HALtoken );
			});

		}
	};


	// Configタブ更新
	let renewConfig = async function (json) {
		inUserNickname.value = json.user.nickname;
		inUserAge.value = json.user.age;
		inUserHeight.value = json.user.height;
		inUserWeight.value = json.user.weight;
		inEllogExpireDays.value = json.HAL.ellogExpireDays;
		inResultExpireDays.value = json.HAL.resultExpireDays;
		inIPv4.value = json.network.IPv4 == ''? 'auto' : json.network.IPv4;
		inIPv6.value = json.network.IPv6 == ''? 'auto' : json.network.IPv6;
		divobservationInterval.innerHTML = '<p> Interval: ' + json.EL.observationInterval + '</p>';
		divobservationDevs.value = JSON.stringify( json.EL.observationDevs,undefined,2 );

		// HAL設定
		renewHALcontents( json.HAL.halApiToken );

		// スマートメータ設定
		inESMUse.checked    = json.ESM.enabled == true ? true:false;
		inDongleType.value  = json.ESM.dongleType;
		inESMId.value       = json.ESM.id;
		inESMPassword.value = json.ESM.password;

		// hue設定
		if (json.Hue.enabled == false ) {
			inHueUse.checked = false;
		} else {
			inHueUse.checked = true;
		}

		if( json.Hue.key == undefined || json.Hue.key == 'undefined') {
			json.Hue.key = '';
		}

		inHueKey.value = json.Hue.key;

		// open weather map設定
		if( json.OWM == null ) {
			json.OWM.enabled = false;
			json.OWM.APIKey = '';
			json.OWM.zipCode = '';
		}
		inOwmUse.checked  = json.OWM.enabled;
		inOwmAPIKey.value = json.OWM.APIKey;
		inZipCode.value   = json.zipCode;

		// netatmo設定
		if( json.netatmo == null ) {  // エラー回避, ほぼ発生しないはず
			json.netatmo.enabled = false;
			json.netatmo.id = '';
			json.netatmo.secret = '';
			json.netatmo.username = '';
			json.netatmo.password = '';
		}
		inNetatmoUse.checked    = json.netatmo.enabled  ? json.netatmo.enabled : false;
		inNetatmoID.value       = json.netatmo.id       ? json.netatmo.id : '';
		inNetatmoSecret.value   = json.netatmo.secret   ? json.netatmo.secret : '';
		inNetatmoUsername.value = json.netatmo.username ? json.netatmo.username : '';
		inNetatmoPassword.value = json.netatmo.password ? json.netatmo.password : '';

		// Omron設定
		inOmronUse.checked = json.Omron.enabled  ? json.Omron.enabled : false;
		inOmronPlace.value = json.Omron.place    ? json.Omron.place   : 'MyRoom';

		// EL設定
		inELUse.checked    = json.EL.enabled  ? json.EL.enabled : false;

	};

	// コンフィグファイルの保存
	let configSave = function () {

		// 家電操作ログ保存日数
		let ellogExpireDays = inEllogExpireDays.value;
		if (ellogExpireDays) {
			if (/[^\d]/.test(ellogExpireDays)) {
				window.addToast( 'Error', '家電操作ログの保存期間は数値のみで指定してください。');
				return;
			}
			ellogExpireDays = parseInt(ellogExpireDays, 10);
			if (ellogExpireDays < 0 || ellogExpireDays > 9999) {
				window.addToast( 'Error', '家電操作ログの保存期間は 0 ～ 9999 の範囲でで指定してください。');
				return;
			}
		} else {
			window.addToast( 'Error', '家電操作ログの保存期間の設定は必須です。');
			return;
		}

		// 成績データ保存日数
		let resultExpireDays = inResultExpireDays.value;
		if (resultExpireDays) {
			if (/[^\d]/.test(resultExpireDays)) {
				window.addToast('Error', '成績データの保存期間は数値のみで指定してください。');
				return;
			}
			resultExpireDays = parseInt(resultExpireDays, 10);
			if (resultExpireDays < 0 || resultExpireDays > 9999) {
				window.addToast('Error', '成績データの保存期間は 0 ～ 9999 の範囲でで指定してください。');
				return;
			}
		} else {
			window.addToast( 'Error', '成績データの保存期間の設定は必須です。');
			return;
		}

		let data = {
			user: {
				height: inUserHeight.value,
				weight: inUserWeight.value,
			},
			network: {
				IPv4: inIPv4.value,
				IPv6: inIPv6.value
			},
			Hue: {
				enabled: inHueUse.checked,
				key: inHueKey.value
			},
			OWM: {
				enabled: inOwmUse.checked,
				APIKey: inOwmAPIKey.value
			},
			netatmo: {
				enabled: inNetatmoUse.checked,
				id: inNetatmoID.value,
				secret: inNetatmoSecret.value,
				username: inNetatmoUsername.value,
				password: inNetatmoPassword.value
			},
			ESM: {
				enabled: inESMUse.checked,
				dongleType: inDongleType.value,
				id: inESMId.value,
				password: inESMPassword.value
			},
			HAL: {
				enabled: document.getElementById('hal-control-box').style.display == 'block' ? true : false,
				halApiToken: inHALApiKey.value,
				ellogExpireDays: ellogExpireDays,
				resultExpireDays: resultExpireDays,
			},
			Omron: {
				enabled: inOmronUse.checked,
				place: inOmronPlace.value
			},
			EL: {
				enabled: inELUse.checked
			},
			zipCode: inZipCode.value,
		};

		configSaveBtn.disabled = true;
		configSaveBtn.textContent = '保存中…';
		window.ipc.configSave( data );
	};


	//----------------------------------------------------------------------------------------------
	// 電力スマートメータ連携チェック
	window.esmUseCheck = function(checkBox) {
		if( checkBox.checked == false ) {
			window.ipc.ESMnotUse( inDongleType.value, inESMId.value, inESMPassword.value );
			window.addToast( 'Info', '電力スマートメーターとの連携を解除しました。');
			return;
		}

		// true にした時のチェック
		if( inDongleType.value == '' || inESMId.value == '' || inESMPassword.value == '' ) { // 情報不足で有効にしたら解説ダイアログ
			checkBox.checked = false;
			esmHelpDialog.showModal();
		}else{  // 全情報あり
			window.ipc.ESMUse( inDongleType.value, inESMId.value, inESMPassword.value );
			window.addToast( 'Info', '電力スマートメーターとの連携を開始しました。実際の通信まで2分程度お待ちください。');
		}
	};




	//////////////////////////////////////////////////////////////////////
	// ボタン

	// HAL同期ボタンが押されたときの処理
	syncBtn.addEventListener('click', function () {
		syncBtn.disabled = true;
		syncBtn.textContent = '同期中…';
		window.ipc.HALsync();
	});

	// 身長、体重セットボタンが押されたときの処理
	btnWeightSet.addEventListener('click', configSave );

	// 設定ボタンが押されたときの処理
	configSaveBtn.addEventListener('click', configSave );


	// HALとの同期をやめた場合、mainから応答があって実行
	let deleteHalApiTokenCallback = function(res) {
		document.getElementById('hal-control-box').style.display = 'none';  // 同期ボタン非表示
		window.addToast( 'Info', 'HAL 連携設定を削除しました。');
		renewHALcontents( null );
	};

	// アンケート回答の投稿ボタンを押したときの処理
	btnQuestionnaireSubmit.addEventListener('click', function () {
		let submitData = window.getQuestionnaire();

		if( submitData != null ) {
			// HAL にアンケート回答が POST される。
			window.ipc.HALsubmitQuestionnaire(submitData);
		}
	} );


	// ローカルに保存された HAL API トークンを取得
	function getHalApiToken() {
		return new Promise((resolve) => {
			getHalApiTokenCallback = (HALtoken) => {
				getHalApiTokenCallback = () => { };
				resolve(HALtoken);
			};
			window.ipc.HALgetApiTokenRequest();
		});
	}

	// HALからProfile取得
	function getHalUserProfile() {
		return new Promise((resolve, reject) => {
			getHalUserProfileCallback = (res) => {
				getHalUserProfileCallback = () => { };
				if (res.error) {
					reject(res.error);
				} else {
					resolve(res.profile);
				}
			};
			window.ipc.HALgetUserProfileRequest();
		});
	}

	// URLを外部ブラウザで開く
	window.URLopen = function( url ) {
		console.log( 'url:', url );
		window.ipc.URLopen( url );
	};

	// テキストエリアを見せたり隠したり
	window.pushHideButton = function( field ) {
		let txtPass = document.getElementById( field );
		let btnEye  = document.getElementById( field + "ButtonEye");
		if (txtPass.type === "text") {
			txtPass.type = "password";
			btnEye.classList.remove( "fa-eye-slash");
			btnEye.classList.add( "fa-eye");
		} else {
			txtPass.type = "text";
			btnEye.classList.add( "fa-eye-slash");
			btnEye.classList.remove( "fa-eye");
		}
	}

	// この関数の最後に呼ぶ
	// 準備できたことをmainプロセスに伝える
	window.ipc.already();
};
