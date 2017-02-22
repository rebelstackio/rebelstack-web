var config = {
	apiKey: "AIzaSyBMB9rO2BtIaRmt6SH8sakZyE02CibIb-8",
	authDomain: "rebelstackchat.firebaseapp.com",
	databaseURL: "https://rebelstackchat.firebaseio.com",
	storageBucket: "rebelstackchat.appspot.com",
	messagingSenderId: "209932179940"
};

var firebaseHelper = {};

firebaseHelper.REBEL_STACK_CLIENT_KEY_NAME = 'REBEL_KEY';

firebaseHelper.REBEL_KEY = null;

firebaseHelper.CLIENT_SOURCE = 'CLIENT';

firebaseHelper.HISTORY_MESSAGE_QTY = 10;

/**
 * _init - Init firebase configuration and set up the client credentials locally
 *
 * @return {Promise}	Firebase Promise
 */
firebaseHelper.init = function _init(){
	//INIT FIREBASE CONFIGURATION
	firebase.initializeApp(config);

	if ( localStorage && localStorage[firebaseHelper.REBEL_STACK_CLIENT_KEY_NAME]){
		firebaseHelper.REBEL_KEY = localStorage.getItem(firebaseHelper.REBEL_STACK_CLIENT_KEY_NAME);
		console.log('GET REBEL KEY FROM LOCALSTORAGE', firebaseHelper.REBEL_KEY);
	}

	if ( !firebaseHelper.REBEL_KEY ){
		firebaseHelper.REBEL_KEY = firebase.database().ref().child('clients').push().key;
		if ( localStorage ){
			localStorage.setItem(firebaseHelper.REBEL_STACK_CLIENT_KEY_NAME, firebaseHelper.REBEL_KEY);
			console.log('SAVE REBEL KEY IN LOCALSTORAGE',	firebaseHelper.REBEL_KEY);
		}
		var newClient = {
			messages: {},
			visitDate : firebase.database.ServerValue.TIMESTAMP
		};

		var updates = {};
		updates['/clients/' + firebaseHelper.REBEL_KEY] = newClient;
		return firebase.database().ref().update(updates);
	} else {
		//THERE IS A KEY IN THE LOCAL STORAGE, SEND BLANK PROMISE
		return new Promise(function(resolve, reject){
			resolve();
		});
	}
}


/**
 * _saveClientInfo - Save the client info
 *
 * @param  {object}  user User object
 * @return {Promise}      Firebase Promise
 */
firebaseHelper.saveClientInfo = function _saveClientInfo(user){
	user.visitDate = firebase.database.ServerValue.TIMESTAMP;
	user.lastActivity = firebase.database.ServerValue.TIMESTAMP;
	var userPath = '/clients/' + firebaseHelper.REBEL_KEY +'/' ;
	return firebase.database().ref().child(userPath).set(user);
}


/**
 * _sendClientMessage - Send the message to the server
 *
 * @param  {string}  message Message descriptions
 * @return {Promise}         FirebasePromise
 */
firebaseHelper.sendClientMessage = function _sendClientMessage(message){
	var path = '/messages/' + firebaseHelper.REBEL_KEY + '/';
	var updates = {};

	//TODO MAYBE I NEED TO MOVE THE USERS LASTACTIVITY UPDATE INSIDE THE PROMISE
	var lastActivityPath = '/clients/' + firebaseHelper.REBEL_KEY;
	var updateUser = {
		'lastActivity': firebase.database.ServerValue.TIMESTAMP,
	};
	firebase.database().ref().child(lastActivityPath).update(updateUser);

	var newMessage = {
		createdAt: firebase.database.ServerValue.TIMESTAMP,
		message: message,
		read: false,
		source: firebaseHelper.CLIENT_SOURCE
	};
	var newMessageKey = firebase.database().ref().child(path).push().key;
	path += newMessageKey;
	updates[path] = newMessage;
	return firebase.database().ref().update(updates);
}

 /**
  * _getMessages - Get the last messages on the current conversation
  *
  * @param  {function} next Callback
  */
firebaseHelper.getMessages = function _getMessages( next ){
	var path = '/messages/' + firebaseHelper.REBEL_KEY  +'/';
	return firebase.database().ref(path).orderByChild('createdAt').limitToLast(firebaseHelper.HISTORY_MESSAGE_QTY).once('value');
}


/**
 * _newServeMessage - new message from server
 *
 * @param  {function} next Callback
 */
firebaseHelper.newServeMessage = function _newServeMessage(next){
	var path = '/messages/' + firebaseHelper.REBEL_KEY  +'/';
	var messagesRef = firebase.database().ref(path).orderByChild('createdAt');
	messagesRef.on('child_added', function(data) {
		next(data);
	});
}
