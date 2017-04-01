var webpack = require("webpack");

module.exports = {
    context: __dirname,
    entry: "./src/asset-warmer.js",
    output: {
        path: __dirname,
        filename: "asset-warmer.min.js"
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            compress: true
        })
    ]
};