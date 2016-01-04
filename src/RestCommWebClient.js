var wrtcClient;
var wrtcEventListener = undefined;
var wrtcConfiguration = undefined;
var currentCall = undefined;
var localStream;
var remoteMedia;
var inCall = false;

/*
$.getScript("js/WebRTComm.js", function() {
   alert("Script loaded but not necessarily executed.");
});
*/

// *** WebRTComm callbacks (i.e. WrtcEventListener callbacks)
function WrtcEventListener(device)  // = function () 
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

	// update connection status and notify Connection and Device listener (notice that both Device and Connection define listeners for disconnect event)
	this.device.connection = new Connection('pending');
	this.device.connection.isIncoming = true;
	this.device.connection.parameters = {
		From: webRTCommCall.callerPhoneNumber, 
		To: '', 
	};

	this.device.onIncoming(this.device.connection);
};

WrtcEventListener.prototype.onWebRTCommCallInProgressEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallInProgressEvent");
};

WrtcEventListener.prototype.onWebRTCommCallRingingBackEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallRingingBackEvent");
	currentCall = webRTCommCall;
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

	//hangupButton.disabled = true;
	//callButton.disabled = false;
};

WrtcEventListener.prototype.onWebRTCommCallOpenedEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallOpenedEvent: received remote stream");
	currentCall = webRTCommCall;

	// add remote media to the remoteMedia html element
	remoteMedia.src = URL.createObjectURL(webRTCommCall.getRemoteBundledAudioVideoMediaStream() ||
				webRTCommCall.getRemoteVideoMediaStream() ||
				webRTCommCall.getRemoteAudioMediaStream());

	// update connection status and notify connection listener
	this.device.connection.status = 'open';
	this.device.onConnect(this.device.connection);
};

WrtcEventListener.prototype.onWebRTCommCallHangupEvent = function(webRTCommCall) 
{
	console.log("WrtcEventListener::onWebRTCommCallHangupEvent");
	currentCall = undefined;
};

function Connection(status)
{
	this.status = status;
	this.muted = false;
	this.onDisconnect = undefined;
	// not found in Twilio docs, but adding to be inline with our mobile SDKs
	this.isIncoming = false;
	//this.onConnect = undefined;
}

Connection.prototype.accept = function()
{

}

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
			currentCall.close();
			inCall = false;
		}
	}
}

var RestCommClient = {
	
	Device: {
		// callback for Device events
		onReady: null,
		onError: null,
		onConnect: null,
		onIncoming: null,
		onDisconnect: null,

		connection: null,
		
		/**
		 * Setup RestComm Web Client SDK 'Device' entity
		 * @param {string} parameters - Parameters for the Device entity
		 */
		setup: function(parameters) {
			console.log("setup");

			// webrtc getUserMedia
			getUserMedia({audio:true, video:parameters.videoEnabled}, 
					function(stream) {
						// got local stream as result of getUserMedia() -add it to localVideo html element
						console.log("Received local stream");
						parameters.localMedia.src = URL.createObjectURL(stream);
						localStream = stream;
						//callButton.disabled = false;
					},
					function(error) {
						console.log("getUserMedia error: ", error);
					}
			);

			// store remote media element for later
			remoteMedia = parameters.remoteMedia;

			// if parameters.registrar is either unset or empty we should function is registrar-less mode
			var register = false;
			if (parameters.registrar && parameters.registrar != "") {
				register = true;
			}

			// Once https://github.com/Mobicents/webrtcomm/issues/24 is fixed we can remove these lines and pass down registrar and domain to webrtcomm
			if (!parameters.registrar || parameters.registrar == "") {
				parameters.registrar = 'wss://cloud.restcomm.com:5063';
			}
			if (!parameters.domain || parameters.domain == "") {
				parameters.domain = 'cloud.restcomm.com';
			}

			// setup WebRTClient
			wrtcConfiguration = {
				communicationMode: WebRTCommClient.prototype.SIP,
				sip: {
					sipUserAgent: 'TelScale RestComm Web Client 1.0.0 BETA4',
					sipRegisterMode: register,
					sipOutboundProxy: parameters.registrar,  // CHANGEME: setup your restcomm instance domain/ip and port
					sipDomain: parameters.domain,  // CHANGEME: setup your restcomm instance domain/ip
					sipDisplayName: parameters.username //'Web-SDK',
					sipUserName: parameters.username,  //'web-sdk',
					sipLogin: parameters.username,  //'web-sdk',
					sipPassword: parameters.password,  //'1234',
				},
				RTCPeerConnection: {
					iceServers: undefined,
					stunServer: 'stun.l.google.com:19302',
					turnServer: undefined,
					turnLogin: undefined,
					turnPassword: undefined,
				}
			};

			// create listener to retrieve webrtcomm events
			wrtcEventListener = new WrtcEventListener(this);

			// initialize webrtcomm facilities through WebRTCommClient and register with RestComm
			wrtcClient = new WebRTCommClient(wrtcEventListener);
			wrtcClient.open(wrtcConfiguration);
		},

		/**
		 * Register callback to be notified when Device is ready
		 * @param {function} callback - Callback to be invoked
		 */
		ready: function(callback) {
			console.log("assign ready callback");
			this.onReady = callback;
		},

		/**
		 * Register callback to be notified when an incoming call arrives
		 * @param {function} callback - Callback to be invoked
		 */
		incoming: function(callback) {
			console.log("assign incoming callback");
			this.onIncoming = callback;
		},

		/**
		 * Register callback to be notified when there's a Device error
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
		 * @param {varies} arg1 - Callback to be invoked (a) or params (b)
		 * @param {dictionary} arg2 - Parameters for the connection
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
							 videoMediaFlag: parameters.videoEnabled,
							 messageMediaFlag: false,
							 audioCodecsFilter: '',
							 videoCodecsFilter: ''
				};

				currentCall = wrtcClient.call(parameters.username, callConfiguration);
				inCall = true; 

				//callButton.disabled = true;
				//hangupButton.disabled = false;

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
		 * Accept an incoming call
		 * @param {dictionary} parameters - Parameters for the connection
		 */
		accept: function (parameters) {
		},

		/**
		 * Register callback to be notified when Connection is disconnected
		 * @param {function} callback - Callback to be invoked
		 */
		disconnect: function (callback) {
			console.log("assign disconnect callback");
			this.onDisconnect = callback;
		},

		/**
		 * Disconnect all active Connections
		 */
		disconnectAll: function () {
			console.log("disconnectAll");
			this.connection.disconnect();
			//this.onDisconnect(this);
		},
	}
}
