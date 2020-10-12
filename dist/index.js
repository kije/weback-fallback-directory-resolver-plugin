"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
class FallbackDirectoryResolverPlugin {
    constructor(options = {}) {
        this.options = Object.assign({}, FallbackDirectoryResolverPlugin.defaultOptions, options);
        this.pathRegex = new RegExp(this.options.getRegex(this.options.prefix));
        this.cache = {};
    }
    pathMatchesPrefix(request) {
        return !!request.match(this.pathRegex);
    }
    apply(resolver) {
        if (resolver.ensureHook) {
            this.applyWebpackV4(resolver);
        }
        else {
            this.applyWebpackV3(resolver);
        }
    }
    applyWebpackV4(resolver) {
        const target = resolver.ensureHook("resolve");
        const resolve = (request, resolveContext, callback) => {
            if (this.pathMatchesPrefix(request.request)) {
                const resolvedComponentPath = this.resolveComponentPath(request.request);
                if (resolvedComponentPath) {
                    const obj = {
                        directory: request.directory,
                        path: request.path,
                        query: request.query,
                        request: resolvedComponentPath,
                    };
                    resolver.doResolve(target, obj, `resolve ${request.request} to ${resolvedComponentPath}`, resolveContext, callback);
                }
                else {
                    // todo info
                    callback();
                }
            }
            else {
                callback();
            }
        };
        resolver.getHook("module").tapAsync("ThemeResolverPlugin", resolve);
    }
    applyWebpackV3(resolver) {
        resolver.plugin("module", (request, callback) => {
            if (this.pathMatchesPrefix(request.request)) {
                const resolvedComponentPath = this.resolveComponentPath(request.request);
                if (resolvedComponentPath) {
                    const obj = {
                        directory: request.directory,
                        path: request.path,
                        query: request.query,
                        request: resolvedComponentPath,
                    };
                    resolver.doResolve("resolve", obj, `resolve ${request.request} to ${resolvedComponentPath}`, callback);
                }
                else {
                    // todo info
                    callback();
                }
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
        if (this.cache[reqPath] === undefined) {
            const options = this.options;
            if (options.directories) {
                this.cache[reqPath] =
                    this.pathsCombinations(reqPath, options.directories, options.extensions).filter((item) => fs.existsSync(item))[0] || null;
            }
            else {
                this.cache[reqPath] = null;
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
