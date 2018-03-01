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
    extensions?: string[];
    getRegex?: (prefix:string) => string;
}

export interface IDirectoryResolverPluginOptions {
    directories: string[];
    prefix: string;
    extensions: string[];
    getRegex: (prefix:string) => string;
}

export class FallbackDirectoryResolverPlugin {
    public static defaultOptions: IDirectoryResolverPluginOptions = {
        extensions: [],
        directories: [],
        prefix: "fallback",
        getRegex: (prefix) => `^#${prefix}#/`,
    };

    private options: IDirectoryResolverPluginOptions;
    private pathRegex: RegExp;

    private cache: { [key: string]: Promise<string> };

    public constructor(options: IFallbackDirectoryResolverPluginOptions = {}) {
        this.options = Object.assign(FallbackDirectoryResolverPlugin.defaultOptions, options);
        this.pathRegex = new RegExp(this.options.getRegex(this.options.prefix));
        this.cache = {};
    }

    public pathMatchesPrefix(request: string): boolean {
        return !!request.match(this.pathRegex);
    }

    public apply(resolver: any) {
        resolver.plugin("module", (request: any, callback: () => void) => {
            if (this.pathMatchesPrefix(request.request)) {
                this.resolveComponentPath(request.request).then(
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

    public pathsCombinations(reqPath: string, directories: string[], extensions?: string[]): string[] {
        const paths = directories
            .map((dir: string) => path.resolve(path.resolve(dir), reqPath))
            .reduce((prev, path) => {
                prev.push(path);
                if (extensions) {
                    extensions.forEach((ext) => prev.push(path + ext));
                }

                return prev;
            }, []);

        return paths;
    }

    public resolveComponentPath(path: string): Promise<string> {
        const reqPath = path.replace(this.pathRegex, "");
        if (!this.cache[reqPath]) {
            const options = this.options;
            if (options.directories) {
                this.cache[reqPath] = Promise.filter(
                    this.pathsCombinations(reqPath, options.directories, options.extensions),
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
