
[Try Restcomm Cloud NOW for FREE!](https://www.restcomm.com/sign-up/) Zero download and install required.


All Restcomm [docs](https://www.restcomm.com/docs/) and [downloads](https://www.restcomm.com/downloads/) are now available at [Restcomm.com](https://www.restcomm.com).



[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2FRestComm%2Frestcomm-web-sdk.svg?type=shield)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2FRestComm%2Frestcomm-web-sdk?ref=badge_shield)

RestComm WebRTC SDK
================

RestComm WebRTC SDK is a simple yet efficient high level, Twilio Compatible JavaScript WebRTC SDK for Web Developers to add Real Time Communications and IM Capabilities to any website. 

RestComm WebRTC SDK allows you to create Real Time Video, Voice and Instant Messaging Web Applications that can connect together any WebRTC enabled Browser (Chrome, Firefox, ...), SIP enabled devices and legacy phones (Cell Phone, Desktop Phone) 


Installation instructions 
==========================================

* Make sure you have NodeJS and NPM is installed on your machine, if not you can get it here: https://nodejs.org/en/download/ 
* CD to /restcomm-web-sdk/samples/hello-world/
* Install required node modules, run below commands:

npm install node-static
npm install https
npm install fs

Open index.html in your favirout text-editor and follow below steps:

Change the var parameters section to be exactly as shown below:

	var parameters = {
			'debug': true,
			'username': 'ENTER SIP USERNAME',       // Created in Restcomm Cloud >> Clients >> Add New
			'password': 'ENTER SIP PASSWORD',                 // Created in Restcomm Cloud >> Clients >> Add New
			'registrar': 'wss://cloud.restcomm.com/webrtc'.   // Restcomm Cloud Registrar, its the same for all Restcomm Cloud Clients
      
   
		};
    
    
    
  #Go down to function call(), and replace with :
    
    function call() {
      var parameters = {
				'username': '18003333333@cloud.restcomm.com',   // Phone number you want to dial when you click on the Call Icon
        
        

Now finally go to directory /restcomm-web-sdk/samples/hello-world/ and run this command to start project:

    	# node server-secure.js
	
	
Open chrome browser and visit https://localhost:7443/index.html 

Click the call button and it will dial 18003333333 via your restcomm cloud account. 

If you do not have a carrier to terminate to the PSTN network, Visit www.telecomsxchange.com/buyerjoin to connect your restcomm cloud account to 300+ Carriers.



