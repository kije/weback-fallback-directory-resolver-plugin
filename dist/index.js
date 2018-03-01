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
        this.options = Object.assign(FallbackDirectoryResolverPlugin.defaultOptions, options);
        this.pathRegex = new RegExp(this.options.getRegex(this.options.prefix));
        this.cache = {};
    }
    pathMatchesPrefix(request) {
        return !!request.match(this.pathRegex);
    }
    apply(resolver) {
        resolver.plugin("module", (request, callback) => {
            if (this.pathMatchesPrefix(request.request)) {
                this.resolveComponentPath(request.request).then((resolvedComponentPath) => {
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
    pathsCombinations(reqPath, directories, extensions) {
        const paths = directories
            .map((dir) => path.resolve(path.resolve(dir), reqPath))
            .reduce((prev, path) => {
            prev.push(path);
            if (extensions) {
                extensions.forEach((ext) => prev.push(path + ext));
            }
            return prev;
        }, []);
        return paths;
    }
    resolveComponentPath(path) {
        const reqPath = path.replace(this.pathRegex, "");
        if (!this.cache[reqPath]) {
            const options = this.options;
            if (options.directories) {
                this.cache[reqPath] = Promise.filter(this.pathsCombinations(reqPath, options.directories, options.extensions), (item) => existsAsync(item).then((exists) => exists).catch(() => false)).any();
            }
            else {
                this.cache[reqPath] = Promise.reject("No Fallback directories!");
            }
        }
        return this.cache[reqPath];
    }
}
FallbackDirectoryResolverPlugin.defaultOptions = {
    extensions: [],
    directories: [],
    prefix: "fallback",
    getRegex: (prefix) => `^#${prefix}#/`,
};
exports.FallbackDirectoryResolverPlugin = FallbackDirectoryResolverPlugin;
module.exports = FallbackDirectoryResolverPlugin;
