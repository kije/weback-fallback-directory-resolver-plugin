"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const existsAsync = (path) => new Promise((resolve) => {
    fs.exists(path, resolve);
});
class FallbackDirectoryResolverPlugin {
    constructor(options = {}) {
        this.options = Object.assign({}, FallbackDirectoryResolverPlugin.defaultOptions, options);
        this.pathRegex = new RegExp(`^#${this.options.prefix}#/`);
        this.cache = {};
    }
    apply(resolver) {
        resolver.plugin("module", (request, callback) => {
            if (request.request.match(this.pathRegex)) {
                const req = request.request.replace(this.pathRegex, "");
                this.resolveComponentPath(req).then((resolvedComponentPath) => {
                    const obj = {
                        directory: request.directory,
                        path: request.path,
                        query: request.query,
                        request: resolvedComponentPath,
                    };
                    resolver.doResolve("resolve", obj, `resolve ${request.request} to ${resolvedComponentPath}`, callback);
                }, () => {
                    // todo info
                    callback();
                });
            }
            else {
                callback();
            }
        });
    }
    resolveComponentPath(reqPath) {
        if (!this.cache[reqPath]) {
            if (this.options.directories) {
                this.cache[reqPath] = Promise.filter(this.options.directories.map((dir) => path.resolve(path.resolve(dir), reqPath)), (item) => existsAsync(item).then((exists) => exists).catch(() => false)).any();
            }
            else {
                this.cache[reqPath] = Promise.reject("No Fallback directories!");
            }
        }
        return this.cache[reqPath];
    }
}
FallbackDirectoryResolverPlugin.defaultOptions = {
    directories: [],
    prefix: "fallback",
};
exports.FallbackDirectoryResolverPlugin = FallbackDirectoryResolverPlugin;
module.exports = FallbackDirectoryResolverPlugin;
