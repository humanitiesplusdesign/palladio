##Installation

You can install and run an instance of Palladio on your local machine, following these instructions.

Clone Palladio by using the GitHub app for [Mac](http://mac.github.com/) or [Windows](http://windows.github.com/) or from the command line:

``` sh
$ git clone git://github.com/humanitiesplusdesign/palladio.git
```
	
Since Palladio uses some server-side functionalities, you need to run Palladio from a local web server (i.e. it is NOT enough to open the `apps/palladio/index.html` file in the browser!). This can be easily done on both Mac, Linux or Windows machines. For example, you can run Python's built-in server within the Palladio directory.

From the command line, browse to Palladio root folder:

``` sh
$ cd palladio
```

Run Python 2 server:

``` sh
$ python -m SimpleHTTPServer
```

or for Python 3+

``` sh
$ python -m http.server
```

Once this is running, go to [http://localhost:8000/apps/palladio](http://localhost:8000/apps/palladio).


Alternatively, if you have Node.js and NPM installed, you can use the development toolchain to run Palladio.

If you don't already have it, install gulp and bower

``` sh
$ npm install -g gulp
$ npm install -g bower
```

From the Palladio root folder, install dependencies:

``` sh
$ npm install
$ bower install
```

Then run gulp, which will launch a webserver on port 8000. If you get an error, make sure you don't have any other servers running.

``` sh
$ gulp
```

Once this is running, go to [http://localhost:8000/](http://localhost:8000/).

Use Ctrl-C to stop the server.

## Development

Generally, update files in the /src directory, not the palladio.js/palladio.css files in the root directory or in the apps directories. When running, Gulp will automatically detect changes in the /src directory and update the compiled Palladio files as required. If you want to rebuild the entire application and not leave gulp running, you can run

``` sh
gulp all
```

### Running tests

Test coverage in Palladio is not great at the moment, but there are tests covering much of the functionality in the various services that Palladio defines. We're working on improving coverage to the rest of the framework.

From the command line at the root directory run:

``` sh
npm test
```