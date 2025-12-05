"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.password = void 0;
const generate_password_ts_1 = __importDefault(require("generate-password-ts"));
exports.password = generate_password_ts_1.default.generate({
    length: 12,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true
});
console.log('Generated password:', exports.password);
//# sourceMappingURL=new_password.js.map