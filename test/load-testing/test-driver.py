#! /usr/bin/env python

# Load testing Restcomm Media Server

import argparse
import sys
import json
import time

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

def threadFunction(dictionary): 
	print '#' + str(dictionary['id']) + ' Running test for URL: ' + dictionary['url']

	chromeOptions = Options()
	# important: don't request permission for media
	chromeOptions.add_argument("--use-fake-ui-for-media-stream")
	# enable browser logging
	caps = DesiredCapabilities.CHROME
	caps['loggingPrefs'] = { 'browser':'ALL' }
	driver = webdriver.Chrome(chrome_options = chromeOptions, desired_capabilities = caps);

	# navigate to web page
	driver.get(dictionary['url'])
	print driver.title
	# print messages

	print 'Waiting for condition to be met'
	WebDriverWait(driver, 30).until(expected_conditions.text_to_be_present_in_element((By.ID,'log'), 'Connection ended'))
	#wait.until(expected_conditions.text_to_be_present_in_element_value((By.ID,'log'), 'Connection ended'))
	#wait.until(expected_conditions.title_contains('RestComm'))

	#time.sleep(30);

	print 'Getting the logs'
	for entry in driver.get_log('browser'):
		# entry is a dictionary
		print(json.dumps(entry, indent = 4))

	# enter a loop to get stats every 2 seconds
	#i = 0;
	#while (1):
	#	print '#' + str(dictionary['id']) + ' Checking JS console'
	#	for entry in driver.get_log('browser'):
	#		# entry is a dictionary
	#		print(json.dumps(entry, indent = 4))

	#assert "Python" in driver.title

	#elem = driver.find_element_by_name("q")
	#elem.send_keys("pycon")
	#elem.send_keys(Keys.RETURN)
	#assert "No results found." not in driver.page_source

	print 'Sleeping for 10'
	time.sleep(10);

	print 'Closing Driver'
	driver.close()

	#print 'Sleeping in thread, filename: ' + filename + '\n'
	#time.sleep(5);
	#print 'Woke up from ' + filename + '\n'

## --------------- Main code --------------- ##

parser = argparse.ArgumentParser()
parser.add_argument('-c', '--count', dest = 'count', default = 10, type = int, help = 'Count of clients spawned')
parser.add_argument('-u', '--url', dest = 'url', default = 'http://127.0.0.1/automated.html', help = 'URL to target')
parser.add_argument('-p', '--password', dest = 'password', default = '1234', help = 'Password for the clients')
args = parser.parse_args()

print 'Using count: ' + str(args.count)
print 'Targeting url: ' + args.url

urls = list()
for i in range(1, args.count + 1):
	urls.append({'id': i, 'url' : args.url + '?username=user' + str(i) + '&password=' + args.password})

# Make the Pool of workers
pool = ThreadPool(args.count) 
# Open the urls in their own threads
# and return the results
results = pool.map(threadFunction, urls)
# close the pool and wait for the work to finish 
pool.close() 
pool.join() 

# raw_input doesn't exist in 3.0 and inputString issues an error in 2.7
if (sys.version_info < (3, 0)):
	inputString = raw_input('Press any key to stop the test\n')
else:
	inputString = input('Press any key to stop the test')

