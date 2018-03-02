const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");

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

    private cache: { [key: string]: string | null };

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
                const resolvedComponentPath = this.resolveComponentPath(request.request);

                if (resolvedComponentPath) {
                        const obj = {
                            directory: request.directory,
                            path: request.path,
                            query: request.query,
                            request: resolvedComponentPath,
                        };

                        resolver.doResolve("resolve", obj, `resolve ${request.request} to ${resolvedComponentPath}`, callback);
                } else {
                        // todo info
                        callback();
                }
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

    public resolveComponentPath(path: string): string | null {
        const reqPath = path.replace(this.pathRegex, "");
        if (this.cache[reqPath] === undefined) {
            const options = this.options;
            if (options.directories) {
                this.cache[reqPath] =
                    this.pathsCombinations(reqPath, options.directories, options.extensions).filter(
                        (item: string) => fs.existsSync(item)
                    )[0] || null;
            } else {
                this.cache[reqPath] = null;
            }
        }

        return this.cache[reqPath];
    }
}

module.exports = FallbackDirectoryResolverPlugin;
