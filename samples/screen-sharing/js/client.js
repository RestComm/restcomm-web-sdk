var aliceButton = document.getElementById("aliceButton");
var bobButton = document.getElementById("bobButton");
var chooseUserForm = document.getElementById("chooseUserForm");
var helloJumbo = document.getElementById("helloJumbo");
var helloJumboUser = document.getElementById("helloJumboUser");
var helloJumboButton = document.getElementById("helloJumboButton");
var screenVideoLocal = document.getElementById("screenVideoLocal");
var screenVideoRemote = document.getElementById("screenVideoRemote");
var extDownloadHref = document.getElementById("extDownloadHref");
var localVideoPanel = document.getElementById("localScreenPanel");
var remoteVideoPanel = document.getElementById("remoteScreenPanel");

var currentUser;
var currentConnection;
aliceButton.onclick = showAlicePage;
bobButton.onclick = showBobPage;


$(document).ready(function() {
	extDownloadHref.href = location.protocol + "//" + location.host  + location.pathname + "screen-sharing-extension.crx";
});

function showAlicePage() {
	showPageOf("alice");
}

function showBobPage() {
	showPageOf("bob");
}

function showPageOf(user) {
	currentUser = user;
	connectToRestcomm();
}

function connectToRestcomm() {
	var parameters = {
			'debug': true,
			'username': currentUser,
			'password': '1234',
			'registrar': 'wss://localhost:5063',
			'domain': 'localhost'
	};
	
	RestCommClient.Device.setup(parameters);
	
	RestCommClient.Device.ready(function(device) {
		console.log(currentUser + " : Ready");
		prepareInitJumbo();
	});
	
	RestCommClient.Device.error(function(error) {
		console.error(currentUser + " : " + error.message);
	});
	
	RestCommClient.Device.connect(function(connection) {
		console.log(currentUser + " : Successfully established call");
		fillSharedJumbo();
	});
	
	
	RestCommClient.Device.disconnect(function(connection) {
			console.log(currentUser + " : Connection ended");
			prepareInitJumbo();
		});
	
	RestCommClient.Device.incoming(function(connection) {		
		var parameters = {  
			//'video-source': 'no-video',
			'video-source': 'screen',  
			'local-media': screenVideoLocal,
			'remote-media': screenVideoRemote,
		};		
		
		currentConnection = connection;
		currentConnection.accept(parameters);
		currentConnection.disconnect(function(connection) {
			console.log(currentUser + " : Connection ended");
			prepareInitJumbo();
		});
		
		
	});
}

function prepareInitJumbo() {
	chooseUserForm.style.display = 'none';
	helloJumbo.style.display = 'block';
	fillJumboForSharing();
}

function fillJumboForSharing() {
	helloJumboUser.innerHTML = helloJumboUserHTML(false);
	helloJumboButton.innerHTML = "Share screen";
	helloJumboButton.onclick = startSharing;
	localVideoPanel.style.display='block'
	remoteVideoPanel.style.display='block'
	screenVideoLocal.src = undefined;
	screenVideoRemote.src = undefined;
}

function fillSharedJumbo() {
	helloJumboUser.innerHTML = helloJumboUserHTML(true);
	helloJumboButton.innerHTML = "Stop sharing";
	helloJumboButton.onclick = hangup;
}


function startSharing() {
	var calleeContact = (currentUser == "alice" ? "bob" : "alice");
	var parameters = {
			'username': calleeContact,  
			//'video-source': 'no-video',
			'video-source': 'screen',    
			'local-media': screenVideoLocal,
			'remote-media': screenVideoRemote,
	};
	
	
	currentConnection = RestCommClient.Device.connect(parameters);
	
	currentConnection.disconnect(function(connection) {
		prepareInitJumbo(); 
	});		

	// Pass a callback to get notified if a Connetion error occurs
	currentConnection.error(function(error) {
		console.error(currentUser + ": Connection error: " + error);
	});
}





function hangup() {
	RestCommClient.Device.disconnectAll();
}


function helloJumboUserHTML(isConnected) {
	return "Hello, " + (currentUser == "alice" ? "Alice" : "Bob") + "! <span class='label " + (isConnected ? "label-success'>Connected" : "label-default'>Disconnected") + "<\/span>";
}

