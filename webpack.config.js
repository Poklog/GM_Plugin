const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "production",
    entry: {
        "service-worker": "./src/service-worker.js",
        "content-script": "./src/content-script.js",
        sidepanel: "./public/sidepanel.js",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        clean: true,
    },
    module: {
        rules: [],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "public/sidepanel.html", to: "sidepanel.html" },
                { from: "public/styles.css", to: "styles.css" },
                { from: "src/utils", to: "utils" },
                // Add placeholder icons (create these later)
                { from: "images", to: "images", noErrorOnMissing: true },
            ],
        }),
    ],
    devtool: "source-map",
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
};
