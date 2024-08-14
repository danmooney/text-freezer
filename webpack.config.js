const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    entry: './index.js',
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
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'source-map'
};
