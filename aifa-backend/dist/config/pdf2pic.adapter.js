"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdf2pic = void 0;
const pdf2pic_1 = require("pdf2pic");
const uuid_adapater_1 = require("./uuid.adapater");
exports.pdf2pic = {
    convert: async (file, page, savePath) => {
        const convert = (0, pdf2pic_1.fromPath)(file, {
            density: 100,
            saveFilename: uuid_adapater_1.uuid.v4(),
            format: "png",
            width: 600,
            height: 900,
            quality: 100,
            savePath,
        });
        try {
            return await convert(page, { responseType: "image" });
        }
        catch (error) {
            console.log(error);
        }
    }
};
//# sourceMappingURL=pdf2pic.adapter.js.map