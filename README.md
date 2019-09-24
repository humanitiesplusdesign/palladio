## Installation

Palladio is a supporting library and set of components. It's best-known use is in the Palladio app, which can be found at https://github.com/humanitiesplusdesign/palladio-app. In order to run Palladio locally, first [make sure you have yarn installed](https://yarnpkg.com/en/docs/install) and then use yarn to install the dependencies and build the assets:

```
git clone https://github.com/humanitiesplusdesign/palladio-app.git
cd palladio-app
yarn install
yarn build
```

Then simply run a local web server from this directory -- if you have python installed, you can just use:
```
python -m http.server
```
or on python 2.x:
```
python -m SimpleHTTPServer
```

## Development

The servable files in the `assets/` folder are built by webpack.  Running `yarn develop` will set webpack to automatically detect changes in the `src/` directory and update the compiled Palladio files as required.  In this state, webpack will update `palladio.js` and `palladio.css` and their related assets only (not the minified versions).  To create new assets suitable for distibution, use `yarn build`, which creates all the needed assets (minified and unminified).

