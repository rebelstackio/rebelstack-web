/**
 * ContactUs Form class
 * @author jegj
 */
var ContactUsForm = {	};

ContactUsForm.CONTACTFORM_POSITION = 3000;

ContactUsForm.FOCUSED = false;

ContactUsForm.LAST_MESSAGE_FROM_CLIENT = true;

ContactUsForm.TRUNCATED_LENGTH = 50;

ContactUsForm.LAST_CLIENT_MESSAGE = null;

ContactUsForm.SEND_MESSAGE_KEY = 13;

ContactUsForm.DEFAULT_DATE_ENTRY = 'Today';

//TODO HANDLE DATES LIKE SLACK
//TODO JOIN MESSAGE WHEN THE LAST USER SEND A MESSAGE AGAIN

//HELPER FUNCTIONS



/**
 * diffDates - Get days of difference between dates
 *
 * @param  {Date} a 		Date1
 * @param  {Date} b 		Date2
 * @return {integer}   	Days of difference
 */
function diffDates(a, b){
	return Math.abs(Math.round((a-b)/(1000*60*60*24)));
}


/**
 * shortDate - Get short date description for date entries
 *
 * @param  {Date} 	date Date
 * @return {String}      Short format
 */
function shortDate(date) {
	var options = {
		month: "short",
		day: "numeric"
	};
	var strDate = date.toLocaleTimeString("en-us", options);
	var timeTokens = strDate.split(',');
	if ( timeTokens.length ){
		text = timeTokens[0];
	} else {
		text = 'Previous';
	}
	return text
}


/**
 * isToday - Check current date
 *
 * @param  {Date} 	date Date
 * @return {boolean}
 */
function isToday(date){
	var pDate = new Date();
	return (
		date.getFullYear() === pDate.getFullYear() &&
		date.getMonth() === pDate.getMonth() &&
		date.getDate() === pDate.getDate()
	);
}

/**
 * _init - Init methods
 *
 */
ContactUsForm.init = function _init(){

	firebaseHelper.init().then(function() {
		console.log('client registered in the server');
		window.addEventListener('scroll', function(){
			if ( ContactUsForm.checkFormFocus() && !ContactUsForm.FOCUSED ) {
				ContactUsForm.FOCUSED = true;
				ContactUsForm.getHistory().then(function(data){
					if ( data.val() ){
						ContactUsForm.buildPreviousConversation(data.val());
						ContactUsForm.focusLastMessageChat();
					} else {
						ContactUsForm.buildContactForm();
					}
				}).catch(function(error){
					//TODO HANDLE ERROR WHEN THERE IS NOR CONNECTION TO FIREBASE
					console.log(error);
				})
			}
		});
	}).catch(function(error){
		console.log('Error trying to connect to server', error);
		//TODO HANDLE ERROR WHEN THERE IS NOR CONNECTION TO FIREBASE THE FIRST TIME
	});
}


/**
 * _buildPreviousConversation - Build previous conversation
 *
 * @param	{Object} messages List of previous messages
 */
ContactUsForm.buildPreviousConversation = function _buildPreviousConversation(messages){
	//BUILD CHAT COMPONENt
	ContactUsForm.buildChatComponent();

	var keys = Object.keys(messages);
	var keyLength = keys.length;
	var lastDate = null;

	for (var i = 0; i < keyLength; i++) {
		var message = messages[keys[i]];
		//FIRST DATE ENTRY
		if ( i == 0 ){
			ContactUsForm.buildDateEntry(message['createdAt']);
		}

		//BUILD DATES ENTRIES BASE ON THE PREVIOUS MESSAGES
		if ( !lastDate ) {
			lastDate = new Date(message['createdAt']);
		} else {
			var tmpDate = new Date(message['createdAt']);
			//CALCULATE DAYS OF DIFFERENCE
			var daysDiff = diffDates(tmpDate, lastDate);
			// var daysDiff = Math.abs(Math.round((tmpDate-lastDate)/(1000*60*60*24)));
			if ( daysDiff > 0 ) {
				ContactUsForm.buildDateEntry(message['createdAt']);
			}
			lastDate = tmpDate;
		}
		//BUILD MESSAGES HISTORY
		switch (message['source']) {
			case 'CLIENT':
				ContactUsForm.buildClientMessage(
					message['message'],
					message['createdAt'],
					message['read'],
					false,
					keys[i]
				);
				break;
			case 'SERVER':
				ContactUsForm.buildServerMessage(
					message['message'],
					message['createdAt'],
					message['read'],
					false,
					keys[i]
				);
				break;
			default:
				console.log('Invalid message\'s source ', message);
				break;
		}
	}
}

/**
 * _buildDateEntry - BUild date entry on chat component
 *
 * @param	{string} timestamp 		String date on the title
 * @return {DOM}						Date Entry Component
 */
ContactUsForm.buildDateEntry = function _buildDateEntry(timestamp){
	if ( !timestamp ) {
		text = ContactUsForm.DEFAULT_DATE_ENTRY;
		timestamp = new Date().getTime();
	} else {
		var date = new Date(timestamp);
		if ( isToday(date) ) {
			text = ContactUsForm.DEFAULT_DATE_ENTRY;
		} else {
			text = shortDate(date);
		}
	}

	var li = document.createElement('li');
	li.setAttribute('class', 'mar-btm date-entry');
	li.setAttribute('id', 'date-entry-' + timestamp);
	li.setAttribute('date', timestamp);

	var div = document.createElement('div');
	div.setAttribute('class', 'hr');

	var span = document.createElement('span');
	span.setAttribute('class', 'hr-title');

	var textNode = document.createTextNode(text);

	span.appendChild(textNode);
	div.appendChild(span);
	li.appendChild(div);

	var chatList = document.getElementById('chat-list');
	chatList.appendChild(li);
}

/**
 * _checkLastDateEntry - Check the last entry on client/server messages
 */
ContactUsForm.checkLastDateEntry = function _checkLastDateEntry(){
	var dateEntries = document.getElementsByClassName("date-entry");
	if ( dateEntries && dateEntries.length ){
		var entry = dateEntries[dateEntries.length - 1];
		var lastTimestamp = parseInt(entry.getAttribute('date'));
		var dateEntry = new Date(lastTimestamp);
		var today = new Date();
		var diff = diffDates(today, dateEntry);
		if ( diff > 0 ){
			//TODAY DATE ENTRY
			ContactUsForm.buildDateEntry();
			//CHANGE LAST DATE ENTRY
			var text	= shortDate(dateEntry);
			var span = entry.getElementsByClassName('hr-title')[0];
			span.innerHTML = text;
		}
	}
}

/**
 * _buildContactForm - Build the initial contact form
 *
 * @return {DOM}	Contact Form
 */
ContactUsForm.buildContactForm = function _buildContactForm(){
	var form = document.createElement('form');
	form.setAttribute('id', 'contact-form');
	form.setAttribute('class', 'contact-form');
	form.setAttribute('role',	'form');
	form.setAttribute('style','display:none;');
	//NAME INPUT
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.setAttribute('class', 'form-control');
	input.setAttribute('id', 'name');
	input.setAttribute('name', 'name');
	input.setAttribute('placeholder', 'Name');
	input.setAttribute('required', 'required');
	//EMAIL
	var email = document.createElement('input');
	email.setAttribute('type', 'email');
	email.setAttribute('class', 'form-control');
	email.setAttribute('id', 'email');
	email.setAttribute('name', 'email');
	email.setAttribute('placeholder', 'Email');
	email.setAttribute('required', 'required');
	//MESSAGE
	var message = document.createElement('textarea');
	message.setAttribute('class', 'form-control');
	message.setAttribute('id', 'message');
	message.setAttribute('name', 'message');
	message.setAttribute('placeholder', 'Message');
	message.setAttribute('rows', '10');
	message.setAttribute('required', 'required');
	// BUTTON
	var button = document.createElement('button');
	button.setAttribute('class', 'btn btn-main btn-lg');
	button.setAttribute('type', 'submit');
	button.setAttribute('id', 'send');
	button.setAttribute('data-loading-text', "<i class='fa fa-spinner fa-spin'></i> Sending...");

	button.addEventListener( 'click', ContactUsForm.saveContatForm);

	var ie = document.createElement('i');
	ie.setAttribute('class', 'fa fa-paper-plane ');
	var text = document.createTextNode('Send');
	button.appendChild(ie);
	button.appendChild(text);
	//ALERT MESSAGE
	var alert = document.createElement('div');
	alert.setAttribute('id', 'result-message');
	alert.setAttribute('role', 'alert');

	form.appendChild(input);
	form.appendChild(email);
	form.appendChild(message);
	form.appendChild(button);

	var formContainer = document.getElementById('form-container');
	formContainer.innerHTML = "";
	formContainer.appendChild(form);
	formContainer.appendChild(alert);

	//UGG JQUERY
	$( "#contact-form" ).fadeIn( "slow" );

	// <form class="contact-form" role="form" action="https://secure.mailjol.net/allforms/u/a5b1c394.php">
	// 	<input type="text" class="form-control" id="Name" name="Name" placeholder="Name" required>
	// 	<input type="email" class="form-control" id="Email" name="Email" placeholder="Email" required>
	// 	<textarea id="Message" name="Message" placeholder="Message" class="form-control" rows="10"></textarea>
	// 	<button class="btn btn-main btn-lg" type="submit" id="send" data-loading-text="<i class='fa fa-spinner fa-spin'></i> Sending..."><i class="fa fa-paper-plane "></i> Send</button>
	// </form>
	// <div id="result-message" role="alert"></div>
}


/**
 * _buildContactForm - Valid cantact form
 *
 */
ContactUsForm.saveContatForm = function _saveContatForm( e ){
	var form = document.getElementById('contact-form');
	if ( form.checkValidity()){
		e.preventDefault();
		var name = document.getElementById('name').value;
		var email = document.getElementById('email').value;
		var message = document.getElementById('message').value;
		var user = {
			'name': name,
			'email': email
		};

		//SAVE USER INFORMATION
		ContactUsForm.saveUserInformation(user);

		//BUILD CHAT COMPONENT
		ContactUsForm.buildChatComponent(message);

		// ASK FOR PERMISSION TO WEB NOTIFICATION
		if ( window.Notification ){
			window.Notification.requestPermission();
		}
	}
}


/**
 * _focusLastMessageChat - Focus the last message on the chat component
 *
 * @return {type}	description
 */
ContactUsForm.focusLastMessageChat = function _focusLastMessageChat(msgContainer){
	var chatHistory = document.getElementById('chat-history');
	if ( chatHistory ){
		// chatHistory.scrollTop = chatHistory.scrollHeight;
		$(chatHistory).mCustomScrollbar(
				"scrollTo","bottom",
				{ scrollInertia:0 }
		);
	}
}

 /**
	* _buildChatComponent - Build chat component
	*
	* @param	{type} message Message description
	*/
ContactUsForm.buildChatComponent = function _buildChatComponent(message){

	var form = document.getElementById('form-container');

	var chatDiv = document.createElement('div');
	chatDiv.setAttribute('class', 'collapse in');
	chatDiv.setAttribute('id', 'chat-container');
	chatDiv.setAttribute('style', 'display:none;');

	var chatHistoryDiv = document.createElement('div');
	chatHistoryDiv.setAttribute('class', 'nano has-scrollbar');
	chatHistoryDiv.setAttribute('id', 'chat-history');

	var chatHistoryContent = document.createElement('div');
	chatHistoryContent.setAttribute('class', 'nano-content pad-all');
	chatHistoryContent.setAttribute('tabindex', '0');

	var chatUl = document.createElement('ul');
	chatUl.setAttribute('class', 'list-unstyled media-block');
	chatUl.setAttribute('id', 'chat-list');

	var messageZone = ContactUsForm.buildMessageZone();

	chatHistoryContent.appendChild(chatUl);
	chatHistoryDiv.appendChild(chatHistoryContent);
	// chatHistoryDiv.appendChild(nanoPane);
	chatDiv.appendChild(chatHistoryDiv);
	chatDiv.appendChild(messageZone);

	form.innerHTML = "";

	form.appendChild(chatDiv);

	//FOCUS
	messageZone.focus();

	//SEND CLIENT MESSAGE
	if ( message ){
		ContactUsForm.sendClientMessage(message);
	}

	//HACK FOR SCROLL BAR
	$(chatHistoryDiv).mCustomScrollbar({
		autoHideScrollbar: true
	});

	setTimeout(function(){
		ContactUsForm.focusLastMessageChat();
	}, 1000);


	//UGG JQUERY
	$( "#chat-container" ).fadeIn( "slow" );

}


/**
 * _buildServerMessage - Build DOM elements from server's message
 *
 * @param	{string} 		message	 Message descrition
 * @param	{timestamp} 	createdAt Message createdAt date
 * @param	{boolean} 		read			Meesage read by the rebel team
 * @param	{boolean} 		sending	 Meesage is sending
 * @param	{string} 		id				Meesage ID
 */
ContactUsForm.buildServerMessage = function _buildServerMessage(message, createdAt, read, sending, id){
	var chatList = document.getElementById('chat-list');
	if ( ContactUsForm.checkLastMessage('SERVER') ) {
		var messages = chatList.getElementsByClassName('mar-btm');
		var lastMessage = messages[messages.length - 1];
		if ( id ) {
			lastMessage.setAttribute('id', 'message-container-' + id);
		}

		if ( createdAt ) {
			lastMessage.setAttribute('createdAt', createdAt);
		}

		var speech = lastMessage.getElementsByClassName('speech')[0];

		var time = ContactUsForm.buildDateMessageFormat(createdAt);

		var textContainer = document.createElement('p');
		textContainer.setAttribute('class', "msg-right");

		var _message = document.createTextNode(message);

		var span = document.createElement('span');
		span.setAttribute('style', 'float:right');
		span.appendChild(time);

		textContainer.appendChild(_message);
		textContainer.appendChild(span);
		speech.appendChild(textContainer);

		//FOCUS LAST MESSAGE
		ContactUsForm.focusLastMessageChat();

		return lastMessage;
	} else {
		var messageExists = document.getElementById('message-container-' + id);

		if ( !messageExists ) {
			var messageContainer = document.createElement('li');
			messageContainer.setAttribute('style', 'display:none;');
			messageContainer.setAttribute('class', 'mar-btm server-message');
			if ( id ) {
				messageContainer.setAttribute('id', 'message-container-' + id);
			}

			if ( createdAt ) {
				messageContainer.setAttribute('createdAt', createdAt);
			}

			var avatarZone = document.createElement('div');
			avatarZone.setAttribute('class', 'media-right');

			var avatar = document.createElement('img');
			avatar.setAttribute('class', 'img-circle img-sm');
			avatar.setAttribute('alt', 'Client');
			avatar.setAttribute('src', 'images/man.svg');


			var messageTextContainer = document.createElement('div');
			messageTextContainer.setAttribute('class', 'media-body pad-hor speech-right');

			var speech = document.createElement('div');
			speech.setAttribute('class', 'speech');

			var linkHeader = document.createElement('a');
			linkHeader.setAttribute('class', "media-heading");

			var clientName = document.createElement('b');

			var name = document.createTextNode('RebelStack\'s Team');

			// var span = document.createElement('span');
			// span.setAttribute('class', 'msg-data-right');

			// var i = document.createElement('i');
			// i.setAttribute('class', 'fa fa-clock-o fa-fw');

			var time = ContactUsForm.buildDateMessageFormat(createdAt);

			var textContainer = document.createElement('p');
			textContainer.setAttribute('class', "msg-right");

			var _message = document.createTextNode(message);
			// textContainer.appendChild(_message);

			var span = document.createElement('span');
			span.setAttribute('style', 'float:right');
			span.appendChild(time);

			textContainer.appendChild(_message);
			textContainer.appendChild(span);

			clientName.appendChild(name);
			// span.appendChild(i);
			// span.appendChild(time);
			linkHeader.appendChild(clientName);
			// linkHeader.appendChild(span);

			speech.appendChild(linkHeader);
			speech.appendChild(textContainer);

			messageTextContainer.appendChild(speech);

			avatarZone.appendChild(avatar);

			messageContainer.appendChild(avatarZone);
			messageContainer.appendChild(messageTextContainer);


			// if ( sending ){
			// 	icon.setAttribute('class', 'fa fa-paper-plane you faa-pulse animated');
			// 	icon.setAttribute('aria-hidden', 'true');
			// 	icon.setAttribute('title', 'Sending message');
			// } else {
			// 	icon.setAttribute('class', 'fa fa-circle you');
			// 	icon.setAttribute('title', 'Message sent');
			// }

			if ( chatList ){
				chatList.appendChild(messageContainer);

				//UGG JQUERY
				$(messageContainer).fadeIn( "slow" );

				//SAVE LAST MESSAGE TYPE
				ContactUsForm.LAST_MESSAGE_TYPE = 'SERVER';

				//FOCUS LAST MESSAGE
				ContactUsForm.focusLastMessageChat();

				return messageContainer;
			}
		}
	}
}

 /**
	* _sendClientMessage - Send the client message to firebase server
	*
	* @param	{type} message Message description
	* @param	{type} user		User object (OPTIONAL)
	* @return {type}				 Firebase Promise
	*/
ContactUsForm.sendClientMessage = function _sendClientMessage(message){
	//TODO CHECK IF WORKS FINE
	ContactUsForm.checkLastDateEntry();
	var lastMessage = ContactUsForm.buildClientMessage(message, null, null, true);
	firebaseHelper.sendClientMessage(message).then(function(){
		//TODO MESSAGE SENT

		// console.log('Message	has been sent to the server ');
		// //CHANGE MESSAGE ICON TO SENT
		// var icon = lastMessage.getElementsByClassName('fa-paper-plane')[0];
		// icon.setAttribute('class', 'fa fa-circle you');
		// icon.setAttribute('title', 'Message sent');
	}).catch(function(error){
		//TODO HANDLE ERROR SENDING MESSAGE
		// console.log('There is an error sending the meesage', error);
		// //CHANGE MESSAGE ICON TO ERROR AND CHANGE CONTAINER'S	BG COLOR
		// var messageContainer = lastMessage.getElementsByClassName('you-message')[0];
		// messageContainer.setAttribute('class', 'message you-message-error');
		// var iconContainer = lastMessage.getElementsByClassName('message-data-name')[0];
		// var icon = iconContainer.getElementsByClassName('fa-paper-plane')[0];
		// icon.setAttribute('class', 'fa fa-times you-error');
		// icon.setAttribute('aria-hidden', 'true');
		// icon.setAttribute('title', 'The message hasn\'t been sent');
	});
}


 /**
	* _buildClientMessage - Build DOM elements from client's message
	*
	* @param	{string} 		message	 Message descrition
	* @param	{timestamp} createdAt Message createdAt date
	* @param	{boolean} 	read			Meesage read by the rebel team
	* @param	{boolean} 	sending	 Meesage is sending to the server
	* @param	{string} 		id	 			Meesage ID
	*/
ContactUsForm.buildClientMessage = function _buildClientMessage(message, createdAt, read, sending, id){
	var chatList = document.getElementById('chat-list');
	if ( ContactUsForm.checkLastMessage('CLIENT') ) {
		var messages = chatList.getElementsByClassName('mar-btm');
		var lastMessage = messages[messages.length - 1];
		var speech = lastMessage.getElementsByClassName('speech')[0];

		var time = ContactUsForm.buildDateMessageFormat(createdAt);

		if ( id ) {
			lastMessage.setAttribute('id', 'message-container-' + id);
		}

		if ( createdAt ) {
			lastMessage.setAttribute('createdAt', createdAt);
		}

		var textContainer = document.createElement('p');
		textContainer.setAttribute('class', "msg-left");

		//ADD STYLE WHEN
		if ( sending ) {
			textContainer.setAttribute('style' , 'background-color: #97c2c6;');
			setTimeout(function(){
				textContainer.setAttribute('style' , '');
			}, 2000);
		}

		var _message = document.createTextNode(message);

		var span = document.createElement('span');
		span.setAttribute('style', 'float:right');
		span.appendChild(time);

		textContainer.appendChild(_message);
		textContainer.appendChild(span);
		speech.appendChild(textContainer);

		//FOCUS LAST MESSAGE
		ContactUsForm.focusLastMessageChat();
		
		return lastMessage;
	} else {
		var messageContainer = document.createElement('li');
		messageContainer.setAttribute('style', 'display:none;');
		messageContainer.setAttribute('class', 'mar-btm client-message');
		if ( id ) {
			messageContainer.setAttribute('id', 'message-container-' + id);
		}
		if ( createdAt ) {
			messageContainer.setAttribute('createdAt', createdAt)
		}

		var avatarZone = document.createElement('div');
		avatarZone.setAttribute('class', 'media-left');

		var avatar = document.createElement('img');
		avatar.setAttribute('class', 'img-circle img-sm');
		avatar.setAttribute('alt', 'Client');
		avatar.setAttribute('src', 'images/man2.svg');


		var messageTextContainer = document.createElement('div');
		messageTextContainer.setAttribute('class', 'media-body pad-hor');

		var speech = document.createElement('div');
		speech.setAttribute('class', 'speech');

		var linkHeader = document.createElement('a');
		linkHeader.setAttribute('class', "media-heading");

		var clientName = document.createElement('b');

		var name = document.createTextNode('You');

		// var span = document.createElement('span');
		// span.setAttribute('class', 'msg-data-left');

		// var i = document.createElement('i');
		// i.setAttribute('class', 'fa fa-clock-o fa-fw');

		// var time = ContactUsForm.buildDateMessageFormat(createdAt);
		var time = ContactUsForm.buildDateMessageFormat(createdAt);

		var textContainer = document.createElement('p');
		textContainer.setAttribute('class', "msg-left");

		var _message = document.createTextNode(message);

		var span = document.createElement('span');
		span.setAttribute('style', 'float:right');
		span.appendChild(time);

		textContainer.appendChild(_message);
		textContainer.appendChild(span);

		clientName.appendChild(name);
		// span.appendChild(i);
		// span.appendChild(time);
		linkHeader.appendChild(clientName);
		// linkHeader.appendChild(span);

		speech.appendChild(linkHeader);
		speech.appendChild(textContainer);

		messageTextContainer.appendChild(speech);

		avatarZone.appendChild(avatar);

		messageContainer.appendChild(avatarZone);
		messageContainer.appendChild(messageTextContainer);

		//TODO HANDLE COMPONENT	SENDING MESSAGE
		// if ( sending ){
		// 	icon.setAttribute('class', 'fa fa-paper-plane you faa-pulse animated');
		// 	icon.setAttribute('aria-hidden', 'true');
		// 	icon.setAttribute('title', 'Sending message');
		// } else {
		// 	icon.setAttribute('class', 'fa fa-circle you');
		// 	icon.setAttribute('title', 'Message sent');
		// }

		chatList.appendChild(messageContainer);

		//UGG JQUERY
		$(messageContainer).fadeIn( "slow" );

		//SAVE LAST MESSAGE TYPE
		ContactUsForm.LAST_MESSAGE_TYPE = 'CLIENT';

		//FOCUS LAST MESSAGE
		ContactUsForm.focusLastMessageChat();

		return messageContainer;
	}
}

ContactUsForm.checkLastMessage = function _checkLastMessage(type){
	var chatList = document.getElementById('chat-list');
	return ContactUsForm.LAST_MESSAGE_TYPE == type;
}

 /**
	* _sendBrowserNotification - Send browser notification to the user
	*
	* @param	{type} message Custom message
	*/
ContactUsForm.sendBrowserNotification = function _sendBrowserNotification(message){
	if ( !ContactUsForm.checkFormFocus() ) {
		if ( window.Notification ) {
			if ( window.Notification.permission != "granted" ) {
				window.Notification.requestPermission();
			}
			if ( message.length > ContactUsForm.TRUNCATED_LENGTH ){
				message = message.substr(0,ContactUsForm.TRUNCATED_LENGTH) + '...';
			}

			var notification = new Notification(
				'New Message from RebelStack\'s Team',
				{
					icon: '../images/logo-notification.png',
					body: message,
					vibrate: [200, 100, 200],
					sound: '../sounds/new_message.mp3'
				}
			);

			notification.onclick = function () {
				location.href = "#message-zone";
			};
		} else {
			console.log("Notifications are not supported for this Browser/OS version yet.");
		}
	}
}


/**
 * _buildMessageZone - Build the textarea above the chat
 *
 * @return {DOM}	MessageZone Component
 */
ContactUsForm.buildMessageZone = function _buildMessageZone(){
	var row = document.createElement('div')
	row.setAttribute('class', 'row');

	var col11 = document.createElement('div')
	col11.setAttribute('class', 'col-xs-11');

	var group = document.createElement('div')
	group.setAttribute('class', 'group');

	var message = document.createElement('input');
	message.setAttribute('class', 'material');
	message.setAttribute('type', 'text');
	message.setAttribute('placeholder', 'Enter your message');
	message.setAttribute('id', 'message-zone');

	var highlight = document.createElement('span');
	highlight.setAttribute('class', 'highlight');

	var bar = document.createElement('span');
	bar.setAttribute('class', 'bar');

	var col1 = document.createElement('div')
	col1.setAttribute('class', 'col-xs-1');
	col1.setAttribute('style', 'padding-left: 0px;');

	var link = document.createElement('a')
	col1.setAttribute('href', '#');

	var image = document.createElement('img');
	image.setAttribute('style',"padding-top: 20px;" );
	image.setAttribute('src',"images/ic_send_white_24px.svg");
	image.setAttribute('alt',"Send");
	image.setAttribute('title',"Send");

	group.appendChild(message);
	group.appendChild(highlight);
	group.appendChild(bar);
	col11.appendChild(group);

	link.appendChild(image);
	col1.appendChild(link);

	row.appendChild(col11);
	row.appendChild(col1);

	message.addEventListener('keypress', function(event){
		var key = event.keyCode;
		if (key === ContactUsForm.SEND_MESSAGE_KEY){
			event.preventDefault();
			var message = event.target.value;
			event.target.value = "";
			ContactUsForm.sendClientMessage(message);
		}
	});

	link.addEventListener('click', function(event){
		event.preventDefault();
		var messageZone = document.getElementById('message-zone');
		var message = messageZone.value;
		messageZone.value = "";
		ContactUsForm.sendClientMessage(message);
	});
	return row;
}


/**
 * _saveUserInformation - Save the user information in memry(also it could be in localstorage)
 *
 */
ContactUsForm.saveUserInformation = function _saveUserInformation(user) {
	if ( user ){
		ContactUsForm.USER = user;
		//SAVE CLIENT INFO ON DATABASE
		firebaseHelper.saveClientInfo(user).then(function(){
			console.log('User updated with info');
		}).catch(function(error){
			console.error('Error trying to save User\'s info', error);
		})
	}
}

 /**
	* _buildDateMessageFormat - Build the date componenet next to the message label
	*
	* @param	{type} createdAt Message Created Date
	* @return {DOM} 					 Date component
	*/
ContactUsForm.buildDateMessageFormat = function _buildDateMessageFormat(createdAt){
	var date;
	if ( createdAt ){
		date = new Date(createdAt);
	} else {
		date = new Date();
	}

	// var options = {
	//  	year: "numeric", month: "short",
	// 	day: "numeric"
	// };

	// var strDate = date.toLocaleTimeString("en-us", options);
	var strDate = date.toLocaleTimeString("en-us");
	var time = document.createTextNode(strDate);
	return time;
}

/**
 * _getHistory - Get the previous conversations with the client base on client's token
 * @return {Promise} Firebase Promise
 *
 */
ContactUsForm.getHistory = function _getHistory( ) {
	console.log('getting the last messages');
	return firebaseHelper.getMessages( );
}

/**
 * _checkFormFocus - Check when the contact section is focused
 *
 * @return {boolean}
 */
ContactUsForm.checkFormFocus = function _checkFormFocus() {
	var body = document.getElementsByTagName('body')[0];
	return body.scrollTop >= ContactUsForm.CONTACTFORM_POSITION;
}

ContactUsForm.serverMessagesEvent = function _serverMessagesEvent(){
	firebaseHelper.newServeMessage(function(data){
		var message = data.val();
		//GET ONLY THE SERVER MESSAGES
		if ( message && message['source'] == 'SERVER' ){
			//TODO CHECK IF WORKS FINE
			ContactUsForm.checkLastDateEntry();
			ContactUsForm.buildServerMessage(
				message['message'],
				message['createdAt'],
				message['read'],
				false,
				data.key
			);
		}
	});
}

document.addEventListener("DOMContentLoaded", function(){
	ContactUsForm.init();
	ContactUsForm.serverMessagesEvent();
});
