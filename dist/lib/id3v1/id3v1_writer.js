"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Id3v1RawWriter {
    constructor(stream, tag, version) {
        this.stream = stream;
        this.version = version;
        this.tag = tag;
    }
    write() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stream.writeAscii('TAG');
            this.stream.writeFixedAsciiString(this.tag.value.title || '', 30);
            this.stream.writeFixedAsciiString(this.tag.value.artist || '', 30);
            this.stream.writeFixedAsciiString(this.tag.value.album || '', 30);
            this.stream.writeFixedAsciiString(this.tag.value.year || '', 4);
            if (this.version === 0) {
                this.stream.writeFixedAsciiString(this.tag.value.comment || '', 30);
            }
            else {
                this.stream.writeFixedAsciiString(this.tag.value.comment || '', 28);
                this.stream.writeByte(0);
                this.stream.writeByte(this.tag.value.track || 0);
            }
            this.stream.writeByte(this.tag.value.genreIndex || 0);
        });
    }
}
class ID3v1Writer {
    write(stream, tag, version) {
        return __awaiter(this, void 0, void 0, function* () {
            if (version < 0 || version > 1) {
                return Promise.reject(Error('Unsupported Version'));
            }
            const writer = new Id3v1RawWriter(stream, tag, version);
            yield writer.write();
        });
    }
}
exports.ID3v1Writer = ID3v1Writer;
//# sourceMappingURL=id3v1_writer.js.map