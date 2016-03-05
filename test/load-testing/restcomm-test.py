#! /usr/bin/env python

# Load testing Restcomm Media Server
#
# Example invocations:
# $ sudo ./restcomm-test.py --client-count 10 --client-url http://127.0.0.1:10510/webrtc-client.html --client-user-prefix user --client-password 1234 --account-sid ACae6e420f425248d6a26948c17a9e2acf --auth-token 0d01c95aac798602579fe08fc2461036 --http-protocol http --transport 127.0.0.1:8080
# TODOs:
#
# - Provision the Restcomm Number as well and make it point to our external service via REST
# - Fix the unprovisioning functionality also remove the Restcomm Clients and Restcomm Number (see above)
# - Allow Restcomm provisioning occur over https. Right http is hard coded
#

import argparse
import sys
import json
import time
import subprocess 
import os 

# Notice that we are using the dummy module which is implemented with threads,
# not multiple processes, as processes might be overkill in our situation (in
# case for example we want to spawn hundredths)
#
# To use multiple processes instead we should  use:
# import multiprocessing
# And replace ThreadPool with Pool
from multiprocessing.dummy import Pool as ThreadPool

# Selenium imports
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
import selenium.common.exceptions

# Globals
TAG = '[restcomm-test] '
httpProcess = None

def threadFunction(dictionary): 
	print TAG + '#' + str(dictionary['id']) + ' Running test for URL: ' + dictionary['url']

	chromeOptions = Options()
	# important: don't request permission for media
	chromeOptions.add_argument("--use-fake-ui-for-media-stream")
	# enable browser logging
	caps = DesiredCapabilities.CHROME
	#caps['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}
	caps['loggingPrefs'] = { 'browser':'ALL' }
	#driver = webdriver.Chrome(chrome_options = chromeOptions, desired_capabilities = caps, service_args = ["--verbose", "--log-path=chrome.log"]);
	driver = webdriver.Chrome(chrome_options = chromeOptions, desired_capabilities = caps);

	# navigate to web page
	driver.get(dictionary['url'])
	#print driver.title

	#print 'Waiting for condition to be met'
	try:
		#WebDriverWait(driver, 30).until(expected_conditions.text_to_be_present_in_element((By.ID,'log'), 'Connection ended'))
		# this is actually a hack to keep the browser open for n seconds. Putting the thread to sleep doesn't work and so far I haven't found a nice way to do that in Selenium
		WebDriverWait(driver, 60).until(expected_conditions.text_to_be_present_in_element((By.ID,'log'), 'Non existing text'))
	except selenium.common.exceptions.TimeoutException as ex:
		print TAG + '#' + str(dictionary['id']) + ' Test timed out'
		
	#wait.until(expected_conditions.title_contains('RestComm'))

	# print messages
	print TAG + '#' + str(dictionary['id']) + ' Saving the logs'
	logBuffer = ''
	for entry in driver.get_log('browser'):
		# entry is a dictionary
		logBuffer += json.dumps(entry, indent = 3)

	logFile = open('browser#' + str(dictionary['id']) + '.log', 'a')
	logFile.write(logBuffer)
	logFile.close()

	#assert "Python" in driver.title
	#elem = driver.find_element_by_name("q")
	#elem.send_keys("pycon")
	#elem.send_keys(Keys.RETURN)
	#assert "No results found." not in driver.page_source

	print TAG + '#' + str(dictionary['id']) + ' Closing Driver'
	driver.close()

# Provision Restcomm Clients via REST call
# count: number of Clients to provision
# accountSid: Restcomm accountSid, like: ACae6e420f425248d6a26948c17a9e2acf
# authToken: Restcomm authToken, like: 0a01c34aac72a432579fe08fc2461036 
# transport: Restcomm transport, like: 127.0.0.1:8080
def provisionClients(count, accountSid, authToken, transport): 
	print TAG + "Provisioning " + str(count) + " Restcomm Clients";
	devnullFile = open(os.devnull, 'w')
	for i in range(1, count + 1):
		cmd = 'curl -X POST http://' + accountSid + ':' + authToken + '@' + transport + '/restcomm/2012-04-24/Accounts/' + accountSid + '/Clients.json -d Login=user' + str(i) + ' -d Password=1234';
		#system(cmd);
		print TAG + cmd 
		subprocess.call(cmd.split(), stdout = devnullFile, stderr = devnullFile)

def startServer(count): 
	print TAG + 'Starting unified node http server to handle both http/https request for the webrtc-client web page, and RCML REST requests from Restcomm';

	# Make a copy of the current environment
	envDictionary = dict(os.environ)   
	# Add the nodejs path, as it isn't found when we run as root
	envDictionary['NODE_PATH'] = '/usr/local/lib/node_modules'
	cmd = 'node server.js ' + str(count) + ' 10512 10510 10511'
	# We want it to run in the background
	#os.system(cmd)
	#subprocess.call(cmd.split(), env = envDictionary)
	global httpProcess
	httpProcess = subprocess.Popen(cmd.split(), env = envDictionary)
	print TAG + 'PID for http server: ' + str(httpProcess.pid)

# TODO: Not finished yet
def unprovisionClients(count, accountSid, authToken, transport): 
	print TAG + "(Not implemented yet) Unprovisioning " + str(count) + " Restcomm Clients";
	#for i in range(1, count + 1):
	#	cmd = 'curl -X DELETE http://' + accountSid + ':' + authToken + '@' + transport + '/restcomm/2012-04-24/Accounts/' + accountSid + '/Clients.json -d Login=user' + str(i) + ' -d Password=1234';
	#	#print TAG + cmd 
	#	subprocess.call(cmd.split())

def stopServer(): 
	if httpProcess:
		print TAG + 'Stopping unified node http server'
		httpProcess.terminate()

def globalSetup(dictionary): 
	print TAG + "Setting up tests"

	# Provision Restcomm with the needed Clients
	provisionClients(dictionary['count'], dictionary['account-sid'], dictionary['auth-token'], dictionary['transport'])

	# Start the unified server script to serve both RCML (REST) and html page for webrtc clients to connect to
	startServer(dictionary['count'])

def globalTeardown(dictionary): 
	print TAG + "Tearing down tests"

	# Provision Restcomm with the needed Clients
	unprovisionClients(dictionary['count'], dictionary['account-sid'], dictionary['auth-token'], dictionary['transport'])

	# Start the unified server script to serve both RCML (REST) and html page for webrtc clients to connect to
	stopServer()

## --------------- Main code --------------- ##

parser = argparse.ArgumentParser()
parser.add_argument('-c', '--client-count', dest = 'count', default = 10, type = int, help = 'Count of Webrtc clients spawned for the test')
parser.add_argument('-u', '--client-url', dest = 'url', default = 'http://127.0.0.1:10510/webrtc-client.html', help = 'Webrtc clients target URL, like \'http://127.0.0.1:10510/webrtc-client.html\'')
parser.add_argument('-w', '--client-register-ws-url', dest = 'registerWsUrl', default = 'ws://127.0.0.1:5082', help = 'Webrtc clients target websocket URL for registering, like \'ws://127.0.0.1:5082\'')
parser.add_argument('-d', '--client-register-domain', dest = 'registerDomain', default = '127.0.0.1', help = 'Webrtc clients domain for registering, like \'127.0.0.1\'')
#parser.add_argument('-e', '--external-service', dest = 'externalService', default = 'http://127.0.0.1:10512/rcml', help = 'External service for Restcomm to get RCML, like \'http://127.0.0.1:10512/rcml\'')
parser.add_argument('-x', '--client-user-prefix', dest = 'userPrefix', default = 'user', help = 'User prefix for the clients, like \'user\'')
parser.add_argument('-p', '--client-password', dest = 'password', default = '1234', help = 'Password for the clients, like \'1234\'')
parser.add_argument('-s', '--account-sid', dest = 'accountSid', required = True, help = 'Restcomm accound Sid, like \'ACae6e420f425248d6a26948c17a9e2acf\'')
parser.add_argument('-a', '--auth-token', dest = 'authToken', required = True, help = 'Restcomm auth token, like \'0a01c34aac72a432579fe08fc2461036\'')
parser.add_argument('-r', '--http-protocol', dest = 'httpProtocol', default = 'http', help = 'Restcomm http protocol: \'http\' (default) or \'https\'')
parser.add_argument('-t', '--transport', dest = 'transport', default = '127.0.0.1:8080', help = 'Restcomm transport, like \'127.0.0.1:8080\'')

args = parser.parse_args()

print TAG + 'Using Webrtc Client count: ' + str(args.count) + ', targeting URL: ' + args.url + ', using password: ' + args.password
print TAG + 'Using Restcomm instance at: ' + args.transport + ' over ' + args.httpProtocol + ', with Account Sid: ' + args.accountSid + ' and Auth Token: ' + args.authToken

# Populate a list with ids and URLs for each client thread that will be spawned
urls = list()
for i in range(1, args.count + 1):
	urls.append({ 
		'id': i, 
		'url' : args.url + '?username=' + args.userPrefix + str(i) + '&password=' + args.password + '&register-ws-url=' + args.registerWsUrl + '&register-domain=' + args.registerDomain,
	})

globalSetup({ 
	'count': args.count, 
	'account-sid': args.accountSid, 
	'auth-token': args.authToken, 
	'transport': args.transport 
})

#sys.exit(0)
print TAG + 'Spawning ' + str(args.count) + ' tester threads' 

# Make the Pool of workers
pool = ThreadPool(args.count) 
# Open the urls in their own threads and return the results
results = pool.map(threadFunction, urls)
# close the pool and wait for the work to finish 
pool.close() 
pool.join() 

# raw_input doesn't exist in 3.0 and inputString issues an error in 2.7
if (sys.version_info < (3, 0)):
	inputString = raw_input(TAG + 'Press any key to stop the test...\n')
else:
	inputString = input(TAG + 'Press any key to stop the test...')

globalTeardown({ 
	'count': args.count, 
	'account-sid': args.accountSid, 
	'auth-token': args.authToken, 
	'transport': args.transport 
})
