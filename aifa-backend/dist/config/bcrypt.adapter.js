"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptjsAdapter = void 0;
const bcryptjs_1 = require("bcryptjs");
exports.bcryptjsAdapter = {
    hash: (password) => {
        const salt = (0, bcryptjs_1.genSaltSync)(10);
        return (0, bcryptjs_1.hashSync)(password, salt);
    },
    compare: (password, hashed) => {
        return (0, bcryptjs_1.compareSync)(password, hashed);
    },
};
//# sourceMappingURL=bcrypt.adapter.js.map