Resgrid BigBoard App
===========================

Resgrid BigBoard an Ionic 2 progressive web application based dashboard that displays data from the Resgrid system.

*********

[![Build status](https://ci.appveyor.com/api/projects/status/i9d14jjv0sut8dgw?svg=true)](https://ci.appveyor.com/project/ShawnJackson/bigboard)

About Resgrid
-------------
Resgrid is a software as a service (SaaS) logistics, management and communications platform for first responders, volunteer fire departments, career fire, EMS, Search and Rescue (SAR), public safety, HAZMAT, CERT, disaster response, etc.

[Sign up for your free Resgrid Account Today!](https://resgrid.com)


## Environment Setup ##

The following prerequisites are required.

* Node.js (6.9.5)
* NPM (>= 3.10.10)
* Cordova (6.5.0)
* Ionic (2.2.1)
* Bower (1.5.2)
* bower-installer (1.2.0)
* Gulp (3.9.0)

*In addition, if you want to run on a emulator or physical device, you'll need your environment setup for iOS or Android development.*

To begin, install the required global components:

	$ npm install -g typescript cordova gulp ionic

Then clone the repository and install the node packages:

	$ git clone https://github.com/Resgrid/BigBoard.git
    $ cd BigBoard
	$ npm install

## Compilation ##

Now you can use the various gulp tasks to obtain Cordova plugins and install third party libraries via Bower.

*You can also just run `gulp` without any arguments which will run the below targets.*

	$ gulp libs       # Install 3rd Party JS libraries as defined in bower.json
	$ gulp plugins    # Install Cordova plugins as defined in package.json

## Development ##

The solution is setup to with Live Reload for Cordova Serve, to use Live Reloading during development:

*Open 1 command line window*

	$ ionic serve	  # Starts the cordova file web server

*Open another command line window*

	$ gulp dev		  # Starts the file watcher and hooks into live reload

## Solution ##



## Dependencies ##
    - [Ionic Framework](http://ionicframework.com/)
    - [Cordova](https://cordova.apache.org/)
    - [Angular2-Grid](https://github.com/BTMorton/angular2-grid)

## Notes ##


## Author's ##
* Shawn Jackson (Twitter: @DesignLimbo Blog: http://designlimbo.com)
* Jason Jarrett (Twitter: @staxmanade Blog: http://staxmanade.com)

## License ##
Apache 2.0