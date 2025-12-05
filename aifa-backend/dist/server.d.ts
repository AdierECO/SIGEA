import { Router } from "express";
interface ServerOptions {
    port: number;
    publicPath: string;
    routes: Router;
}
export declare class Server {
    private readonly options;
    private readonly app;
    private readonly routes;
    constructor(options: ServerOptions);
    start(): Promise<void>;
}
export {};
//# sourceMappingURL=server.d.ts.map