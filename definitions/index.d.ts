export interface IFallbackDirectoryResolverPluginOptions {
    directories?: string[];
    prefix?: string;
    extensions?: string[];
    getRegex?: (prefix: string) => string;
}
export interface IDirectoryResolverPluginOptions {
    directories: string[];
    prefix: string;
    extensions: string[];
    getRegex: (prefix: string) => string;
}
export declare class FallbackDirectoryResolverPlugin {
    static defaultOptions: IDirectoryResolverPluginOptions;
    private options;
    private pathRegex;
    private cache;
    constructor(options?: IFallbackDirectoryResolverPluginOptions);
    pathMatchesPrefix(request: string): boolean;
    apply(resolver: any): void;
    private applyWebpackV4(resolver);
    private applyWebpackV3(resolver);
    pathsCombinations(reqPath: string, directories: string[], extensions?: string[]): string[];
    resolveComponentPath(path: string): string | null;
}
