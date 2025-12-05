"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
class Server {
    options;
    app;
    routes;
    constructor(options) {
        this.options = options;
        this.app = (0, express_1.default)();
        this.routes = this.options.routes;
    }
    async start() {
        // Middlewares
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)());
        this.app.use((0, compression_1.default)());
        // Routes
        this.app.use(this.routes);
        this.app.listen(this.options.port, () => {
            console.log(`Servidor escuchando en puerto ${this.options.port}`);
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map