let path = require("path");
let webpack = require("webpack");
let libraryName = "larynx";
let DtsBundlerPlugin = require("dtsbundler-webpack-plugin");
let outfileName = "larynx.min";

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.join(__dirname, "dist"),
        filename: outfileName + ".js",
        library: libraryName,
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    externals: {
        "xml2json": "xml2json",
        "pug": "pug"
    },
    devtool: "source-map",
    target: "node",
    plugins: [
        new DtsBundlerPlugin({
            out: "./" + outfileName + ".d.ts",
        })
    ],
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: "ts-loader"
            },
            {
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    }
};