"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const id3v1_reader_1 = require("./id3v1.reader");
const id3v1_writer_1 = require("./id3v1.writer");
const fs_extra_1 = __importDefault(require("fs-extra"));
const __1 = require("../..");
const update_file_1 = require("../common/update-file");
const stream_writer_file_1 = require("../common/stream-writer-file");
class ID3v1 {
    read(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new id3v1_reader_1.ID3v1Reader();
            return yield reader.read(filename);
        });
    }
    readStream(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new id3v1_reader_1.ID3v1Reader();
            return yield reader.readStream(stream);
        });
    }
    remove(filename, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const stat = yield fs_extra_1.default.stat(filename);
            let removed = false;
            yield update_file_1.updateFile(filename, { id3v1: true }, !!options.keepBackup, () => true, (layout, fileWriter) => __awaiter(this, void 0, void 0, function* () {
                let finish = stat.size;
                for (const t of layout.tags) {
                    if (t.id === __1.ITagID.ID3v1) {
                        removed = true;
                        if (finish > t.start) {
                            finish = t.start;
                        }
                    }
                }
                yield fileWriter.copyRange(filename, 0, finish);
            }));
            return removed;
        });
    }
    write(filename, tag, version, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield fs_extra_1.default.pathExists(filename);
            if (!exists) {
                yield this.writeTag(filename, tag, version);
            }
            else {
                yield this.replaceTag(filename, tag, version, !!options.keepBackup);
            }
        });
    }
    writeTag(filename, tag, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = new stream_writer_file_1.FileWriterStream();
            yield stream.open(filename);
            const writer = new id3v1_writer_1.ID3v1Writer();
            try {
                yield writer.write(stream, tag, version);
            }
            catch (e) {
                yield stream.close();
                return Promise.reject(e);
            }
            yield stream.close();
        });
    }
    replaceTag(filename, tag, version, keepBackup) {
        return __awaiter(this, void 0, void 0, function* () {
            const stat = yield fs_extra_1.default.stat(filename);
            yield update_file_1.updateFile(filename, { id3v1: true }, keepBackup, () => true, (layout, fileWriter) => __awaiter(this, void 0, void 0, function* () {
                let finish = stat.size;
                for (const t of layout.tags) {
                    if (t.id === __1.ITagID.ID3v1) {
                        if (finish > t.start) {
                            finish = t.start;
                        }
                    }
                }
                yield fileWriter.copyRange(filename, 0, finish);
                const writer = new id3v1_writer_1.ID3v1Writer();
                yield writer.write(fileWriter, tag, version);
            }));
        });
    }
}
exports.ID3v1 = ID3v1;
//# sourceMappingURL=id3v1.js.map