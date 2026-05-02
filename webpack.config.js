const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'textfreezer',
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
    devtool: isProduction ? false : 'source-map',
    watch: !isProduction, // Enable watch in non-production mode
    watchOptions: {
        ignored: /node_modules|[^.js]$/, // Ignore changes to non-js files and node_modules
        aggregateTimeout: 300, // Delay the rebuild after the first change (in ms)
        poll: 1000 // Check for changes every second (useful for network file systems)
    }
};
