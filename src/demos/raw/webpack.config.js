var webpack = require('webpack');
var path = require('path');

module.exports = {
    mode: "production",
    entry: path.resolve(__dirname, "app", "index.ts"),
    output: {
        path: path.resolve(__dirname, "app"),
        filename: "index.js"
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx']

    },
    devtool: 'cheap-module-eval-source-map',
    module: {
        rules: [{
            test: /\.tsx?$/, use: [
                {
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.dist.es2015.json"
                    }
                }
            ]
        }, {
            test: /\.html$/,
            use: [{
                loader: 'file-loader?name=[path][name].[ext]&context='
            }, {
                loader: 'extract-loader'
            }, {
                loader: 'html-loader'

            }]
        }]
    },
    plugins: [],
    devServer: {
        inline: true,
        overlay: true,
        compress: true,
        host: "0.0.0.0",
        disableHostCheck: true,
        contentBase: path.resolve(__dirname, "app")
    }
};
