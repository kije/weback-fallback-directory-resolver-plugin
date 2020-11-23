# webpack-fallback-directory-resolver-plugin
Webpack Resolver plugin to resolve modules and files through a fallback chain at compile time.

## Description
This is a Resolver-Plugin for webpack. It enables resolving modules by looking up files in an fallback directory chain.

Let's look at a simple example.

Suppose you have an application `greeter` to greet users in different languages.
The file structure of this application looks something like this:

```
/greeter
  - /src
    - /de
      - translations.js
    - /en
      - translations.js
      - ordnial.js
    - ordnial.js
    - index.js

```

The `translations.js` files contain the translated strings, which are used by index.js.

```js
// /greeter/src/en/translations.js

export default {
    "hello": "Hello",
    "nth_visitor_start": "You are the",
    "visitor": "visitor"
    // ...
};
```

```js
// /greeter/src/de/translations.js

export default {
    "hello": "Hallo",
    "nth_visitor_start": "Du bist der",
    "visitor": "Besucher"
    // ...
};
```

There are also two `ordnial.js` files containing a function which returns a number with its ordinal postfix.

```js
// /greeter/src/ordnial.js

export default (num) => {
    return `${num}.`;
};
```

```js
// /greeter/src/en/ordnial.js
// different ordnial postfixes for en

export default (num) => {
    switch (num) {
        case 0:
           return num;

        case 1:
            return `${num}st`;

        case 2:
            return `${num}nd`;

        case 3:
            return `${num}rd`;

        default:
            return `${num}th`;
    }
};
```


Now suppose you want to create two separate webpack builds for each language.
The resulting build should only contain the translations strings and the ordinal function for its language.

To do this, you can set up `webpack-fallback-directory-resolver-plugin` to resolve these files based on a language parameter (Environment variable) on build time.

```js
// webpack.config.js

const FallbackDirectoryResolverPlugin = require('webpack-fallback-directory-resolver-plugin');
const path = require('path');

// get the language from the environment
const language = process.env.LANGUAGE || 'en';

module.exports = {
    context: __dirname,
    entry: "./src/index.js",
    output: {
        path: __dirname + "/dist",
        filename: `script.${language}.js`
    },
    resolve: {
        plugins: [
            new FallbackDirectoryResolverPlugin(
                {
                    prefix: 'language-resolve',
                    directories: [
                        // this is the fallback directory chain. The plugin tries to resolve the file first
                        // in the `src/${language}` folder. If it can't be found there, it will try to resolve it in the next directory in the chain, and so on...
                        path.resolve(__dirname, `src/${language}`),
                        path.resolve(__dirname, `src`)
                    ]
                }
            )
        ]
    }
};

```


```js
// /greeter/src/index.js

import translations from "#language-resolve#/translations.js"; // translations is dynamically resolved to
import ordinal from "#language-resolve#/ordnial.js";

const greet = (name) => {
    console.log(`${translations.hello}`)
};

const greetNthVisitor = (num) => {
    // this will output "You are the 1st Visitor" in the en build,
    // and "Du bist der 1. Besucher" in the de  build.
    console.log(`${translations.nth_visitor_start} ${ordinal(num)} ${translations.visitor}`)
};

export {
    greet,
    greetNthVisitor
};

```

Another usage example would be a react application, which has multiple themes with different JSX-Markups.

For more information, take a look at the [example application](https://github.com/kije/webpack-fallback-directory-resolver-plugin/tree/master/example).



## Installation

Install this plugin via `yarn` or `npm` alongside with [`webpack`](https://www.npmjs.com/package/webpack).

```bash
yarn add --dev webpack-fallback-directory-resolver-plugin
```
or

```bash
npm install --save-dev webpack-fallback-directory-resolver-plugin
```

## Usage
Add `webpack-fallback-directory-resolver-plugin` as a `resolve`-Plugin in your `webpack.config.js`-File

**Example**
```js
// webpack.config.js

const FallbackDirectoryResolverPlugin = require('webpack-fallback-directory-resolver-plugin');

// ...

module.exports = {
    // ...

    resolve: {
        plugins: [
            new FallbackDirectoryResolverPlugin(
                {
                    prefix: 'fallback',
                    directories: [
                        // this is the fallback directory chain. The plugin tries to resolve the file first
                        // in the `js/dir2` folder. If it can't be found there, it will try to resolve it in the next directory in the chain, and so on...
                        path.resolve(__dirname, 'js/dir2'),
                        path.resolve(__dirname, 'js/dir1')
                    ]
                }
            )
        ]
    }
};

```

### Options

The `FallbackDirectoryResolverPlugin` takes an option object as its argument.

Possible options are:

#### prefix
The prefix is used to make sure this resolver is only used explicitly.

Also, you could add multiple instances of this plugin with different prefixes.

Usage: prefix the module path in the import statement with `#<prefix>#/<file-to-resolve>`, where `<prefix>` is the prefix you specified in `options.prefix`.

Default: fallback

#### directories
An array of directory paths the resolver should try to resolve the imported files in.

The plugin tries to resolve the file first in the first directory. If it can't find it there, it tries the next directory and so on.

#### extensions
Automatically resolve specified extensions. This is an array of the extensions to resolve automatically, for example
```
extensions: ['.js', '.jsx']
```

#### getRegex
you can provide a function that takes prefix as an argument and returns a regex string used to identify the import paths to resolve.
By default this plugin matches paths in the form #**prefix**#/. If you want your paths to be on the form @**prefix**/ you will provide the following function:
```
   getRegex: (prefix) => `^@${prefix}/`
```

## Bugs
If you encounter any bugs, please consider [opening an issue on GitHub](https://github.com/kije/webpack-fallback-directory-resolver-plugin/issues).
