var wrtcClient;
var wrtcEventListener = undefined;
var wrtcConfiguration = undefined;
var localStream;
var remoteMedia;
var username;
var inCall = false;

/*
$.getScript("js/WebRTComm.js", function() {
   alert("Script loaded but not necessarily executed.");
});
*/

// --- WrtcEventListener callbacks
function WrtcEventListener(device)
{
	console.log("WrtcEventListener constructor");
	this.device = device;
}

// General events (WebRTCommClient listener)

// Client is ready
WrtcEventListener.prototype.onWebRTCommClientOpenedEvent = function() 
{
   console.log("onWebRTCommClientOpenedEvent");
	this.device.onReady(this.device);
};

WrtcEventListener.prototype.onWebRTCommClientOpenErrorEvent = function(error) 
{
    console.log("onWebRTCommClientOpenErrorEvent");
};

WrtcEventListener.prototype.onWebRTCommClientClosedEvent = function() 
{
	console.log("onWebRTCommClientClosedEvent");
};

WrtcEventListener.prototype.onGetUserMediaErrorEventHandler = function(error) 
{
	console.debug('MobicentsWebRTCPhoneController:onGetUserMediaErrorEventHandler(): error='+error);
};

// Call related listeners (WebRTCommCall listener)

// Ringing for incoming calls 
WrtcEventListener.prototype.onWebRTCommCallRingingEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallRingingEvent");

	if (webRTCommCall.incomingCallFlag == true) {
		// update connection status and notify Connection and Device listener (notice that both Device and Connection define listeners for disconnect event)
		this.device.connection = new Connection('pending');
		this.device.connection.isIncoming = true;
		this.device.connection.parameters = {
			'From': webRTCommCall.callerPhoneNumber, 
			'To': '', 
		};

		this.device.connection.webrtcommCall = webRTCommCall;
		this.device.connection.onDisconnect = this.device.onDisconnect;
		this.device.onIncoming(this.device.connection);
	}
};

WrtcEventListener.prototype.onWebRTCommCallInProgressEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallInProgressEvent");
};

WrtcEventListener.prototype.onWebRTCommCallRingingBackEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallRingingBackEvent");
	this.device.connection.webrtcommCall = webRTCommCall;
	//currentCall = webRTCommCall;
};

WrtcEventListener.prototype.onWebRTCommCallOpenErrorEvent = function(webRTCommCall, error) 
{
	console.log("WrtcEventListener::onWebRTCommCallOpenErrorEvent");
};

WrtcEventListener.prototype.onWebRTCommCallClosedEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallClosedEvent");

	// update connection status and notify Connection and Device listener (notice that both Device and Connection define listeners for disconnect event)
	this.device.connection.status = 'closed';
	this.device.connection.onDisconnect(this.device.connection);
	this.device.onDisconnect(this.device.connection);
};

WrtcEventListener.prototype.onWebRTCommCallOpenedEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallOpenedEvent: received remote stream");
	//currentCall = webRTCommCall;
	this.device.connection.webrtcommCall = webRTCommCall;

	// add remote media to the remoteMedia html element
	remoteMedia.src = URL.createObjectURL(webRTCommCall.getRemoteBundledAudioVideoMediaStream() ||
				webRTCommCall.getRemoteVideoMediaStream() ||
				webRTCommCall.getRemoteAudioMediaStream());

	// update connection status and notify connection listener
	this.device.connection.status = 'open';
	this.device.onConnect(this.device.connection);
	inCall = true; 
};

WrtcEventListener.prototype.onWebRTCommCallHangupEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallHangupEvent");
	this.device.connection.webrtcommCall = undefined;
	//currentCall = undefined;
};

// Message related events

// Message arrived
WrtcEventListener.prototype.onWebRTCommMessageReceivedEvent = function(message) {
	console.log("WrtcEventListener::onWebRTCommMessageReceivedEvent");
	var parameters = {
		'From': message.from,
		'Text': message.text,
	};

	this.device.onMessage(parameters);
};

WrtcEventListener.prototype.onWebRTCommMessageSentEvent = function(message) {
	console.log("WrtcEventListener::onWebRTCommMessageSentEvent");
};

WrtcEventListener.prototype.onWebRTCommMessageSendErrorEvent = function(message, error) {
	console.log("WrtcEventListener::onWebRTCommMessageSendErrorEvent");
};


/**
 * @class Connection 
 * @classdesc <p>Connection represents a call. A Connection can be either incoming or outgoing. Connections are not created by themselves but as a result on an action on Device. For example to initiate an outgoing connection you call [Device.connect(parameters)]{@link Device#connect} which instantiates and returns a new Connection. On the other hand when an incoming connection arrives and you have previously registered a callback for receiving incoming connection events by calling [RestCommClient.Device.incoming(callback)]{@link Device#incoming}, you will be notified through that callback and be passed the new Connection object that you can use to control the connection.</p>
 * <p>When an incoming connection arrives it is considered 'pending' until it is either accepted with [Connection.accept()]{@link Connection#accept} or rejected with [Connection.reject()]{@link Connection#reject}. Once the connection is accepted the Connection transitions to 'open' state.</p>
 * 
 * <p>When an outgoing connection is created with [Device.connect(parameters)]{@link Connection#connect} it starts with state 'pending'. Once it starts ringing on the remote party it transitions to 'connecting'. When the remote party answers it, the Connection state transitions to 'open'.</p>
 * 
 * <p>Once an Connection (either incoming or outgoing) is established (i.e. 'open') media can start flowing over it. DTMF digits can be sent over to the remote party using [Connection.sendDigits(digits)]{@link Connection#sendDigits}. When done with the Connection you can disconnect it with [Connection.disconnect()]{@link Connection#disconnect}.</p>
 * @constructor
 * @public
 * @param  {status} Initial status for the Connection
 */
function Connection(status)
{
	/**
	 * Status of the Connection. Possible values are: <b>pending</b>, <b>connecting</b>, <b>open</b>, <b>closed</b>
	 * @name Connection#status
	 * @type String
	 */
	this.status = status;
	/**
	 * Whether Connection is muted or not
	 * @name Connection#muted
	 * @type Boolean
	 */
	this.muted = false;
	/**
	 * Callback for when Connection is disconnected
	 * @name Connection#onDisconnect
	 * @type Function
	 */
	this.onDisconnect = undefined;
	// not found in Twilio docs, but adding to be inline with our mobile SDKs
	/**
	 * Is the Connection incoming or outgoing
	 * @name Connection#isIncoming
	 * @type Function
	 */
	this.isIncoming = false;
	/**
	 * The underlying webrtc call structure, not to be exposed to the App
	 * @name Connection#webrtcommCall
	 * @private
	 * @type Object
	 */
	this.webrtcommCall = undefined;  // lower level call structure
}

/**
 * Accept an incoming call
 * @param {dictionary} parameters - Parameters for the connection <br>
 * - <b>'videoEnabled'</b> : Should we enable video internally when calling WebRTC getUserMedia() (boolean) <br>
 */
Connection.prototype.accept = function(parameters)
{
	var callConfiguration = {
		displayName: username,
		localMediaStream: localStream,
		audioMediaFlag: true,
		videoMediaFlag: parameters['video-enabled'],
		messageMediaFlag: false
	};

	if (this.webrtcommCall) {
		this.webrtcommCall.accept(callConfiguration);
		this.status = 'open';
	}
}

/**
 * Sends DTMF digits over this Connection
 * @param {String} digits - DTMF digits to send across the Connection
 */
Connection.prototype.sendDigits = function(digits)
{
	console.log("Connection: sendDigits");
	if (this.webrtcommCall) {
		this.webrtcommCall.sendDTMF(digits);
	}
}

/**
 * This function has a dual purpose: a. if invoked with a single function
 * argument it registers a callback to be notified when the connection is
 * disconnected, and b. if invoked with no arguments it disconnects the connection
 * @param {function} callback - Callback to be invokeda in (a)
 */
Connection.prototype.disconnect = function(callback)
{
	if (callback !== undefined) {
		// we are passed a callback, need to keep the listener for later use
		console.log("Connection: assign disconnect callback");
		this.onDisconnect = callback;
	}
	else {
		// we are not passed any argument, just disconnect
		console.log("Connection: disconnecting");
		if (inCall) {
			this.webrtcommCall.close();
			this.webrtcommCall = undefined;
			inCall = false;
		}
	}
}

/**
 * RestCommClient is a namespace for Client Library entities
 * @namespace
 */
var RestCommClient = {
	/**
	 * @class Device
	 * @classdesc <p>A Device represents an abstraction of a communications device able to make and receive calls, send and receive messages etc. Remember that in order to be notified of RestComm Client events you need to 'register' for interesting events by passing callbacks. If you want to initiate a media connection towards another party you use [Device.connect(parameters)]{@link Device#connect} which returns a Connection object representing the new outgoing connection. From then on you can act on the new connection by applying Connection methods on the handle you got from [Device.connect(parameters)]{@link Device#connect}. If there’s an incoming connection and you have previously registered a callback for receiving incoming connection events by calling [Device.incoming(callback)]{@link Device#incoming}, you will be notified through that callback. At that point you can use Connection methods to accept or reject the connection.</p>
	 * <p>As far as instant messages are concerned you can send a text message using [Device.sendMessage(parameters)]{@link Device#sendMessage} and you will be notified of an incoming message if you have previously registered a callback for incoming messages by calling [Device.message(callback)]{@link Device#message}.</p>
	 * @public
	 */
	Device: {
		// --- Callbacks for Device events
		/** 
		 * Callback called when Device is ready
		 * @name Device#onReady
		 * @type Function
		 */
		onReady: null,
		/** 
		 * Called if there's an error with the Device
		 * @name Device#onError
		 * @type Function
		 */
		onError: null,
		/** 
		 * Called when Connection state changes
		 * @name Device#onConnect
		 * @type Function
		 */
		onConnect: null,
		/** 
		 * Called when incoming Connection arrives
		 * @name Device#onIncoming
		 * @type Function
		 */
		onIncoming: null,
		/** 
		 * Called when incoming text message arrives
		 * @name Device#onMessage
		 * @type Function
		 */
		onMessage: null,
		/** 
		 * Called when Connection disconnects
		 * @name Device#onDisconnect
		 * @type Function
		 */
		onDisconnect: null,

		/**
		 * Current Connection belonging to Device
		 * @name Device#connection
		 * @type Object
		 */
		connection: null,
		
		/**
		 * Setup RestComm Web Client SDK 'Device' entity
		 * @function Device#setup
		 * @param {string} parameters - Parameters for the Device entity: <br>
		 * <b>username</b> : Username for the client, i.e. <i>web-sdk</i> <br>
		 * <b>password</b> : Password to be used in client authentication, i.e. <i>1234</i> <br>
		 * <b>registrar</b> : URL for the registrar, i.e. <i>wss://cloud.restcomm.com:5063</i> <br>
		 * <b>domain</b> : domain to be used, i.e. <i>cloud.restcomm.com</i> <br>
		 * <b>localMedia</b> : Local media stream, usually an HTML5 video or audio element <br>
		 * <b>remoteMedia</b> : Remote media stream, usually an HTML5 video or audio element <br>
		 * <b>videoEnabled</b> : Should we enable video internally when calling WebRTC getUserMedia() (boolean) <br>
		 */
		setup: function(parameters) {
			console.log("setup");

			// webrtc getUserMedia
			getUserMedia({audio:true, video:parameters['video-enabled']}, 
					function(stream) {
						// got local stream as result of getUserMedia() -add it to localVideo html element
						console.log("Received local stream");
						parameters['local-media'].src = URL.createObjectURL(stream);
						localStream = stream;
						//callButton.disabled = false;
					},
					function(error) {
						console.log("getUserMedia error: ", error);
					}
			);

			// store remote media element for later
			remoteMedia = parameters['remote-media'];

			// if parameters.registrar is either unset or empty we should function is registrar-less mode
			var register = false;
			if (parameters['registrar'] && parameters['registrar'] != "") {
				register = true;
			}

			// Once https://github.com/Mobicents/webrtcomm/issues/24 is fixed we can remove these lines and pass down registrar and domain to webrtcomm
			if (!parameters['registrar'] || parameters['registrar'] == "") {
				parameters['registrar'] = 'wss://cloud.restcomm.com:5063';
			}
			if (!parameters['domain'] || parameters['domain'] == "") {
				parameters['domain'] = 'cloud.restcomm.com';
			}

			// setup WebRTClient
			wrtcConfiguration = {
				communicationMode: WebRTCommClient.prototype.SIP,
				sip: {
					sipUserAgent: 'TelScale RestComm Web Client 1.0.0 BETA4',
					sipRegisterMode: register,
					sipOutboundProxy: parameters['registrar'],
					sipDomain: parameters['domain'],
					sipDisplayName: parameters['username'],
					sipUserName: parameters['username'],
					sipLogin: parameters['username'],
					sipPassword: parameters['password'],
				},
				RTCPeerConnection: {
					iceServers: undefined,
					stunServer: 'stun.l.google.com:19302',
					turnServer: undefined,
					turnLogin: undefined,
					turnPassword: undefined,
				}
			};

			username = parameters['username'];

			// create listener to retrieve webrtcomm events
			wrtcEventListener = new WrtcEventListener(this);

			// initialize webrtcomm facilities through WebRTCommClient and register with RestComm
			wrtcClient = new WebRTCommClient(wrtcEventListener);
			wrtcClient.open(wrtcConfiguration);
		},

		/**
		 * Register callback to be notified when Device is ready
		 * @function Device#ready
		 * @param {function} callback - Callback to be invoked
		 */
		ready: function(callback) {
			console.log("assign ready callback");
			this.onReady = callback;
		},

		/**
		 * Register callback to be notified when an incoming call arrives
		 * @function Device#incoming
		 * @param {function} callback - Callback to be invoked
		 */
		incoming: function(callback) {
			console.log("assign incoming callback");
			this.onIncoming = callback;
		},

		/**
		 * Register callback to be notified when an incoming message arrives
		 * @function Device#message
		 * @param {function} callback - Callback to be invoked
		 */
		message: function(callback) {
			console.log("assign message callback");
			this.onMessage = callback;
		},

		/**
		 * Register callback to be notified when there's a Device error
		 * @function Device#error
		 * @param {function} callback - Callback to be invoked
		 */
		error: function (callback) {
			console.log("assign error callback");
			this.onError = callback;
		},

		/**
		 * This function has a dual purpose: a. if invoked with a single function
		 * argument it registers a callback to be notified when there's an update
		 * in the Connection like transitioning to Connected, etc, and b. if
		 * invoked with two optional non function arguments it initiates a call towards a
		 * remote party with the given params
		 * @function Device#connect
		 * @param {varies} arg1 - Callback to be invoked (a) or params (b)
		 * @param {dictionary} arg2 - Parameters for the connection: <br>
		 * <b>username</b> : Username for the called party, i.e. <i>+1235@cloud.restcomm.com</i> <br>
		 * <b>videoEnabled</b> : Whether we want video enabled for the call (boolean) <br>
		 */
		connect: function (arg1, arg2) {
			if (typeof arg1 == "function") {
				// we are passed a callback, need to keep the listener for later use
				var callback = arg1;
				console.log("assign ready callback");
				this.onConnect = callback;
			}
			else {
				// we are passed regular arguments, let's connect
				console.log("connect");
				var parameters = arg1;
				// not implemented yet
				var audioConstraints = arg2;

				this.connection = new Connection('connecting');

				var callConfiguration = {
							 displayName: wrtcConfiguration.sip.sipDisplayName,
							 localMediaStream: localStream,
							 audioMediaFlag: true,
							 videoMediaFlag: parameters['video-enabled'],
							 messageMediaFlag: false,
							 audioCodecsFilter: '',
							 videoCodecsFilter: ''
				};

				this.connection.webrtcommCall = wrtcClient.call(parameters['username'], callConfiguration);
				this.connection.onDisconnect = this.onDisconnect;
				//inCall = true; 


				if (localStream.getVideoTracks().length > 0) {
					console.log('Using video device: ' + localStream.getVideoTracks()[0].label);
				}
				if (localStream.getAudioTracks().length > 0) {
					console.log('Using audio device: ' + localStream.getAudioTracks()[0].label);
				}

				return this.connection;
			}
		},

		/**
		 * Send text message
		 * @function Device#sendMessage
		 * @param {dictionary} parameters - Parameters for the message: <br>
		 * <b>username</b> : target URI <br>
		 * <b>message</b> : text message to send
		 */
		sendMessage: function (parameters) {
			// right now we are not interested in sending message directly to an ongoing call since it will complicate the API. But let's leave this piece of code
			// around because we might need it in the future
			/*
			if (this.connection && this.connection.webrtcommCall && this.connection.webrtcommCall.peerConnectionState === 'established') {
				this.connection.webrtcommCall.sendMessage(parameters.message);
			}
			*/

			wrtcClient.sendMessage(parameters['username'], parameters['message']);
		},

		/**
		 * Register callback to be notified when Connection is disconnected
		 * @function Device#disconnect
		 * @param {function} callback - Callback to be invoked
		 */
		disconnect: function (callback) {
			console.log("assign disconnect callback");
			this.onDisconnect = callback;
		},

		/**
		 * Disconnect all active Connections
		 * @function Device#disconnectAll
		 */
		disconnectAll: function () {
			console.log("disconnectAll");
			this.connection.disconnect();
			//this.onDisconnect(this);
		},
	}
}
