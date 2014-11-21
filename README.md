##Installation

You can install and run an instance of Palladio on your local machine, following these instructions.

Clone Palladio by using the GitHub app for [Mac](http://mac.github.com/) or [Windows](http://windows.github.com/) or from the command line:

``` sh
$ git clone git://github.com/humanitiesplusdesign/palladio.git
```
	
Since Palladio uses some server-side functionalities, you need to run Palladio from a local web server (i.e. it is NOT enough to open the `index.html` file in the browser!). This can be easily done on both Mac, Linux or Windows machines. For example, you can run Python's built-in server within the Palladio directory.

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

Once this is running, go to [http://localhost:8000/](http://localhost:8000/).
