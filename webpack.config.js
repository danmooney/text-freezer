const path = require('path');
module.exports = {entry: './index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'textFreezer',
        libraryTarget: 'umd'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {loader: 'babel-loader', options: {presets: ['@babel/preset-env']}}
        }]
    },
    mode: 'production'
};
