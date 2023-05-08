var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

const path = require('path');

module.exports = (env, argv) => {
    var configSrcMap = false;
    var devmode = false;
    var OutBndlFile = "bundle.prod.js";
    devmode = true;
    configSrcMap = 'inline-source-map';

    if (argv.mode == "development" || env == "development" || process.env.NODE_ENV === 'development'){
        OutBndlFile = "bundle.dev.js";
        process.env.NODE_ENV = "development";
    }

    return {
        entry: './src/main.ts',
        devtool: configSrcMap,
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name(_file) {
                                    console.log("A Png.."+_file);
                                    return  (devmode) ? 'images/[name].[ext]': 'images/[hash].[ext]';
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(obj)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name(_file) {
                                    console.log(`A Obj file ${_file}`);
                                    return  (devmode) ? 'obj/[name].[ext]': 'obj/[hash].[ext]';
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(mp3|ogg)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name(_file) {
                                    console.log(`A Mp3 file ${_file}`);
                                    return  (devmode) ? 'music/[name].[ext]': 'music/[hash].[ext]';
                                },
                            },
                        },
                    ],
                },
            ]
        },
        resolve: {
            fallback: {
                "fs": false,
                "child_process":false
            },
            extensions: [ '.tsx', '.ts', '.js' ]
        },
        output: {
            filename: OutBndlFile,
            path: path.resolve(__dirname, 'dist')
        },
        plugins: [
            new NodePolyfillPlugin(),
            new HtmlWebpackPlugin({
                template : 'index.html',
                title    : 'Game',
                desc     : '',
            }),
            new CopyPlugin({
                patterns: [
                    { from: "src/assets/music", to: "music" },
                    { from: "src/assets/images/boom.png", to: "images/boom.png" },
                    { from: "src/assets/images/parasurf.png", to: "images/parasurf.png" }
                ],
            }),
        ],
        devServer : {
            compress : true,
        },
    }
};
