/// <reference types="node" />
import { IID3V2 } from './id3v2__types';
import { Readable } from 'stream';
import { ReaderStream } from '../common/stream-reader';
export declare class ID3v2Reader {
    private readHeader;
    private readRawTag;
    readTag(reader: ReaderStream): Promise<{
        rest?: Buffer;
        tag?: IID3V2.RawTag;
    }>;
    scan(reader: ReaderStream): Promise<{
        rest?: Buffer;
        tag?: IID3V2.RawTag;
    }>;
    private readID3ExtendedHeaderV3;
    private readID3ExtendedHeaderV4;
    readID3v2Header(buffer: Buffer, offset: number): IID3V2.TagHeader | null;
    readReaderStream(reader: ReaderStream): Promise<IID3V2.RawTag | undefined>;
    readStream(stream: Readable): Promise<IID3V2.RawTag | undefined>;
    read(filename: string): Promise<IID3V2.RawTag | undefined>;
    readFrames(data: Buffer, tag: IID3V2.RawTag): Promise<Buffer>;
}
