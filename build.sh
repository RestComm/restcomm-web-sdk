#! /bin/sh -x

# Concatenate all modules into a single JS debug library and then generate non-debug and minified versions of the JS library and put them all at 'build' directory

rm -R build
mkdir build

#cat ./src/*.js > ./build/restcomm-webrtc-sdk.debug.js
cat ./src/*.js > ./build/restcomm-webrtc-sdk.js

#grep -v "logger.debug" ./build/restcomm-webrtc-sdk.debug.js  > ./build/restcomm-webrtc-sdk.js

java -jar yuicompressor-2.4.7.jar ./build/restcomm-webrtc-sdk.js -o ./build/restcomm-webrtc-sdk.min.js
