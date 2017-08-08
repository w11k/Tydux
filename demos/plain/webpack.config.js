const webpack = require('webpack');
const path = require("path");
const ats = require('awesome-typescript-loader');

module.exports = {
    entry: path.resolve(__dirname, "app", "index.ts"),
    output: {
        path: path.resolve(__dirname, "app"),
        filename: "index.js"
    },
    resolve: {
        extensions: ["", '.js', '.ts', '.tsx']

    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    },
    plugins: [
        new ats.CheckerPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
        inline: true,
        contentBase: path.resolve(__dirname, "app")
    }
};
