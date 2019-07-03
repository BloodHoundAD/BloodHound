{
  "name": "bloodhound",
  "version": "2.2.0",
  "description": "Graph Theory for Active Directory",
  "prettier": {
    "tabWidth": 4,
    "trailingComma": "es5",
    "semi": true,
    "singleQuote": true,
    "jsxSingleQuote": true
  },
  "keywords": [
    "Graph",
    "Active Directory"
  ],
  "homepage": "https://github.com/BloodHoundAD/Bloodhound",
  "repository": {
    "type": "git",
    "url": "https://github.com/BloodHoundAD/Bloodhound.git"
  },
  "bugs": "https://github.com/BloodHoundAD/Bloodhound/issues",
  "license": "GPL-3.0",
  "author": "Rohan Vazarkar <rvazarkr@gmail.com> (https://blog.cptjesus.com)",
  "contributors": [
    "Andy Robbins <robbins.andy@gmail.com> (https://www.wald0.com)",
    "Will Schroeder <will@harmj0y.net> (https://www.harmj0y.net)"
  ],
  "main": "main.js",
  "scripts": {
    "start": "cross-env NODE_ENV=development electron .",
    "dev": "concurrently -k \"babel-node server.js\" \"npm start\"",
    "winbuild": "webpack --config webpack.config.production.js && electron-packager . BloodHound --platform=win32 --arch=all --overwrite --prune --ignore=./*.zip --ignore=./BloodHound.* --ignore=BloodHoundExampleDB.graphdb --ignore=Ingestors --ignore=node_modules/\\.bin --icon=src/img/icon.ico",
    "macbuild": "webpack --config webpack.config.production.js && electron-packager . BloodHound --platform=darwin --arch=all --overwrite --prune --ignore=./*.zip --ignore=./BloodHound.* --ignore=BloodHoundExampleDB.graphdb --ignore=Ingestors --ignore=node_modules/\\.bin --icon=src/img/icon.icns",
    "linuxbuild": "webpack --config webpack.config.production.js && electron-packager . BloodHound --platform=linux --arch=all --overwrite --prune --ignore=./*.zip --ignore=./BloodHound.* --ignore=BloodHoundExampleDB.graphdb --ignore=Ingestors --ignore=node_modules/\\.bin"
  },
  "babel": {
    "presets": [
      "env",
      "stage-0",
      "react"
    ]
  },
  "devDependencies": {
    "babel-cli": "^6.26.0",
    "babel-core": "^6.26.3",
    "babel-loader": "^7.1.2",
    "babel-polyfill": "^6.26.0",
    "babel-preset-env": "^1.6.1",
    "babel-preset-react": "^6.24.1",
    "babel-preset-stage-0": "^6.24.1",
    "concurrently": "^3.5.1",
    "cross-env": "^5.1.3",
    "electron": "^5.0.3",
    "express": "^4.16.2",
    "webpack": "^3.10.0",
    "webpack-dev-middleware": "^2.0.4",
    "webpack-hot-middleware": "^2.21.0"
  },
  "dependencies": {
    "@fortawesome/fontawesome-free": "^5.1.1",
    "async": "^2.6.0",
    "bootstrap": "^3.3.7",
    "bootstrap-3-typeahead": "^4.0.2",
    "dagre": "^0.7.4",
    "electron-store": "^1.3.0",
    "eventemitter2": "^4.1.0",
    "fontfaceobserver": "^2.0.13",
    "image-size": "^0.6.3",
    "image-type": "^3.0.0",
    "is-zip-file": "^1.0.2",
    "jquery": "^3.2.1",
    "linkurious": "^1.5.1",
    "md5-file": "^4.0.0",
    "mustache": "^2.3.0",
    "neo4j-driver": "^1.7.5",
    "prop-types": "^15.7.2",
    "react": "^16.8.6",
    "react-alert": "^5.5.0",
    "react-alert-template-basic": "^1.0.0",
    "react-bootstrap": "0.32.0",
    "react-dom": "^16.8.6",
    "react-if": "^3.4.3",
    "react-images": "^1.0.0",
    "react-photo-gallery": "^8.0.0",
    "react-transition-group": "^4.2.0",
    "stream-json": "^1.1.4",
    "unzipper": "^0.8.9",
    "uuid": "^3.3.2"
  }
}
