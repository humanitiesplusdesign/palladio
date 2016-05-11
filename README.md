##Installation

Palladio is a supporting library and set of components. It's best-known use is in the Palladio app, which can be found at https://github.com/humanitiesplusdesign/palladio-app. In order to run Palladio locally, install NPM and Bower if you have not already, and run the following commands:

```sh
git clone https://github.com/humanitiesplusdesign/palladio-app.git
cd palladio-app
bower install
python -m SimpleHTTPServer
```

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