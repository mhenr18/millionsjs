var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var path = require('path');
var env = require('yargs').argv.mode;

var libraryName = 'millions';

var plugins = [], outputFile;

if (env === 'examples') {
    module.exports = {
        entry: {
            'intro': __dirname + '/examples/intro.js',
            'add-remove': __dirname + '/examples/add-remove.js'
        },
        //devtool: 'source-map',
        output: {
            path: __dirname + '/dist',
            filename: '[name].js'
        },
        module: {
            loaders: [
                {
                    test: /(\.jsx|\.js)$/,
                    loader: 'babel',
                    exclude: /(node_modules|bower_components)/
                },
                {
                    test: /\.scss$/,
                    loaders: ["style", "css", "sass"]
                }
            ]
        },
        resolve: {
            root: [
                path.resolve('./examples'),
                path.resolve('./lib')
            ],
            extensions: ['', '.js', '.min.js']
        },
        plugins: plugins
    };
} else {
    if (env === 'build') {
        plugins.push(new UglifyJsPlugin({ minimize: true }));
        outputFile = libraryName + '.min.js';
    } else {
        outputFile = libraryName + '.js';
    }

    module.exports = {
        entry: __dirname + '/src/millions.js',
        //devtool: 'source-map',
        output: {
            path: __dirname + '/lib',
            filename: outputFile,
            library: libraryName,
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        module: {
            loaders: [
                {
                    test: /(\.jsx|\.js)$/,
                    loader: 'babel',
                    exclude: /(node_modules|bower_components)/
                }
            ]
        },
        resolve: {
            root: path.resolve('./src'),
            extensions: ['', '.js']
        },
        plugins: plugins
    };
}
