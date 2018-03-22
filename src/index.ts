const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");

const existsAsync: (path: string) => Promise<boolean> = (path: string) => new Promise(
    (resolve: (result: boolean) => void) => {
        fs.exists(path, resolve);
    }
);

export interface IFallbackDirectoryResolverPluginOptions {
    directories?: string[];
    prefix?: string;
}

export class FallbackDirectoryResolverPlugin {
    public static defaultOptions: IFallbackDirectoryResolverPluginOptions = {
        directories: [],
        prefix: "fallback",
    };

    private options: IFallbackDirectoryResolverPluginOptions;
    private pathRegex: RegExp;

    private cache: { [key: string]: Promise<string> };

    public constructor(options: IFallbackDirectoryResolverPluginOptions = {}) {
        this.options = Object.assign({}, FallbackDirectoryResolverPlugin.defaultOptions, options);
        this.pathRegex = new RegExp(`^#${this.options.prefix}#/`);
        this.cache = {};
    }

    public apply(resolver: any) {
        resolver.plugin("module", (request: any, callback: () => void) => {
            if (request.request.match(this.pathRegex)) {
                const req = request.request.replace(this.pathRegex, "");

                this.resolveComponentPath(req).then(
                    (resolvedComponentPath: string) => {
                        const obj = {
                            directory: request.directory,
                            path: request.path,
                            query: request.query,
                            request: resolvedComponentPath,
                        };
                        resolver.doResolve("resolve", obj, `resolve ${request.request} to ${resolvedComponentPath}`, callback);
                    },
                    () => {
                        // todo info
                        callback();
                    },
                );
            } else {
                callback();
            }
        });
    }

    public resolveComponentPath(reqPath: string): Promise<string> {
        if (!this.cache[reqPath]) {
            if (this.options.directories) {
                this.cache[reqPath] = Promise.filter(
                    this.options.directories.map((dir: string) => path.resolve(path.resolve(dir), reqPath)),
                    (item: string) => existsAsync(item).then((exists: boolean) => exists).catch(() => false),
                ).any();
            } else {
                this.cache[reqPath] = Promise.reject("No Fallback directories!");
            }
        }

        return this.cache[reqPath];
    }
}

module.exports = FallbackDirectoryResolverPlugin;
