#! /bin/sh -x

# Concatenate all modules into a single JS debug library and then generate non-debug and minified versions of the JS library and put them all at 'build' directory

rm -R build
mkdir build

cat ./src/*.js > ./build/restcomm-web-client.debug.js
grep -v "console\.\(debug\|warn\|info\|log\)" ./build/restcomm-web-client.debug.js  > ./build/restcomm-web-client.js
java -jar yuicompressor-2.4.7.jar ./build/restcomm-web-client.js -o ./build/restcomm-web-client.min.js
