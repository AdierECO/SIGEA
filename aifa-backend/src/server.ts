import path from "path";
import express, { Application, Router } from "express";
import cors from "cors";
import compression from "compression";


interface ServerOptions {
    port: number;
    publicPath: string;
    routes: Router;
}

export class Server {

    private readonly app: Application;
    private readonly routes: Router;

    constructor(
        private readonly options: ServerOptions,
    ) {
        this.app = express();
        this.routes = this.options.routes;
    }

    public async start() {

        // Middlewares
        this.app.use( express.json() );
        this.app.use( express.urlencoded({ extended: true }) );
        this.app.use( cors() );
        this.app.use( compression() );

        // Routes
        this.app.use(this.routes);
        
        this.app.listen(this.options.port, () => {
            console.log(`Servidor escuchando en puerto ${this.options.port}`);
        });
    }

}