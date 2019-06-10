"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const id3v2_reader_1 = require("./id3v2_reader");
const id3v2_writer_1 = require("./id3v2_writer");
const id3v2_frames_1 = require("./id3v2_frames");
const streams_1 = require("../common/streams");
const utils_1 = require("../common/utils");
const update_file_1 = require("../common/update-file");
const __1 = require("../..");
const mp3_frame_1 = require("../mp3/mp3_frame");
function buildID3v2(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        const frames = [];
        for (const frame of tag.frames) {
            const f = yield id3v2_frames_1.readID3v2Frame(frame, tag.head);
            frames.push(f);
        }
        return {
            id: tag.id,
            start: tag.start,
            end: tag.end,
            head: tag.head,
            frames: frames
        };
    });
}
exports.buildID3v2 = buildID3v2;
class ID3v2 {
    read(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new id3v2_reader_1.ID3v2Reader();
            const tag = yield reader.read(filename);
            if (tag) {
                return yield buildID3v2(tag);
            }
        });
    }
    readStream(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new id3v2_reader_1.ID3v2Reader();
            const tag = yield reader.readStream(stream);
            if (tag) {
                return yield buildID3v2(tag);
            }
        });
    }
    extractRaw(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new id3v2_reader_1.ID3v2Reader();
            const tag = yield reader.read(filename);
            if (tag) {
                return yield utils_1.fileRangeToBuffer(filename, tag.start, tag.end);
            }
        });
    }
    writeTag(filename, frames, head) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = new streams_1.FileWriterStream();
            yield stream.open(filename);
            const writer = new id3v2_writer_1.ID3v2Writer();
            try {
                yield writer.write(stream, frames, head, 0);
            }
            catch (e) {
                yield stream.close();
                return Promise.reject(e);
            }
            yield stream.close();
        });
    }
    replaceTag(filename, frames, head, keepBackup, paddingSize) {
        return __awaiter(this, void 0, void 0, function* () {
            yield update_file_1.updateFile(filename, { id3v2: true, mpegQuick: true }, keepBackup, () => true, (layout, fileWriter) => __awaiter(this, void 0, void 0, function* () {
                const writer = new id3v2_writer_1.ID3v2Writer();
                yield writer.write(fileWriter, frames, head, paddingSize);
                let start = 0;
                let specEnd = 0;
                for (const tag of layout.tags) {
                    if (tag.id === __1.ITagID.ID3v2) {
                        if (start < tag.end) {
                            specEnd = tag.head.size + tag.start + 10;
                            start = tag.end;
                        }
                    }
                }
                if (layout.frameheaders.length > 0) {
                    const mediastart = mp3_frame_1.rawHeaderOffSet(layout.frameheaders[0]);
                    start = specEnd < mediastart ? specEnd : mediastart;
                }
                else {
                    start = Math.max(start, specEnd);
                }
                yield fileWriter.copyFrom(filename, start);
            }));
        });
    }
    write(filename, tag, version, rev, keepBackup, paddingSize = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            const head = {
                ver: version,
                rev: rev,
                size: 0,
                valid: true,
                syncSaveSize: tag.head ? tag.head.syncSaveSize : undefined,
                flags: tag.head ? tag.head.flags : undefined,
                flagBits: tag.head ? tag.head.flagBits : undefined,
                extended: tag.head ? tag.head.extended : undefined
            };
            const raw_frames = yield id3v2_frames_1.writeToRawFrames(tag.frames, head);
            const exists = yield fs_extra_1.default.pathExists(filename);
            if (!exists) {
                yield this.writeTag(filename, raw_frames, head);
            }
            else {
                yield this.replaceTag(filename, raw_frames, head, !!keepBackup, paddingSize);
            }
        });
    }
}
exports.ID3v2 = ID3v2;
//# sourceMappingURL=id3v2.js.map