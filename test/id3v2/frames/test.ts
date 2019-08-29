import {expect, should} from 'chai';
import {describe, it, run} from 'mocha';

import {BufferUtils} from '../../../src/lib/common/buffer';
import {synchsafe, unsynchsafe} from '../../../src/lib/common/utils';
import {ID3v2_ENCODINGS} from '../../../src/lib/id3v2/id3v2.header.consts';
import {IID3V2} from '../../../src/lib/id3v2/id3v2.types';
import {ID3V2ValueTypes} from '../../../src/lib/id3v2/id3v2.consts';
import {MemoryWriterStream} from '../../../src/lib/common/stream-writer-memory';
import {BufferReader} from '../../../src/lib/common/buffer-reader';
import {IFrameImpl} from '../../../src/lib/id3v2/frames/id3v2.frame';
import {FrameIdAscii} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.id-ascii';
import {FrameIdBin} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.id-bin';
import {FrameText} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.text';
import {FrameLangDescText} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.lang-desc-text';
import {FramePic} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.pic';
import {FrameAscii} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.ascii';
import {FrameIdText} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.id-text';
import {FramePlayCount} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.playcount';
import {FrameMusicCDId} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.musiccdid';
import {FramePopularimeter} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.popularimeter';
import {FrameBooleanString} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.boolstring';
import {FrameUnknown} from '../../../src/lib/id3v2/frames/implementations/id3v2.frame.unknown';

describe('SyncSaveInt', function() {
	it('should calculate back & forth', function() {
		expect(unsynchsafe(synchsafe(0))).to.equal(0);
		expect(unsynchsafe(synchsafe(265))).to.equal(265);
		expect(unsynchsafe(synchsafe(268435455))).to.equal(268435455); // max size
		expect(unsynchsafe(synchsafe(268435456))).to.equal(0); // overflow
	});
});

async function writebackandforth(val: IFrameImpl, testobj: { encoding?: string, value: IID3V2.FrameValue.Base }, head: IID3V2.TagHeader): Promise<any> {
	const stream = new MemoryWriterStream();
	const frame: IID3V2.Frame = {id: 'test', value: testobj.value, head: {size: 0, statusFlags: {}, formatFlags: {}, encoding: testobj.encoding ? testobj.encoding : undefined}};
	await val.write(frame, stream, head);
	const reader = new BufferReader(stream.toBuffer());
	const result = await val.parse(reader, {id: 'test', start: 0, end: 0, size: 0, statusFlags: {}, formatFlags: {}, data: stream.toBuffer()}, head);
	should().exist(result);
	if (!result) {
		return;
	}
	should().exist(result.value);
	return {head: {encoding: result.encoding ? result.encoding.name : undefined}, value: result.value};
}

describe('ID3v2Frames', () => {

	const ver = 4;
	const testValues =
		[
			'012345abcdefghijklmnopqrstuvwxyz67890',
			'äöüé',
			''
		];
	const encs = Object.keys(ID3v2_ENCODINGS[ver]).map(key => {
		return ID3v2_ENCODINGS[ver][key];
	});

	const ints = [0, 1, 42, 2147483647, 2147483648];

	const tagHead: IID3V2.TagHeader = {
		ver: 4,
		rev: 0,
		size: 0,
		valid: true
	};

	describe('AsciiValue', () => {
		const val = FrameAscii;
		testValues.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.Ascii = {text: testValue};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.text).to.equal(testval.text);
			});
		});
	});

	describe('Text', () => {
		const val = FrameText;
		encs.forEach(enc => {
			describe('Endcoding: ' + enc, () => {
				testValues.forEach(testValue => {
					it('should write back & forth: ' + testValue, async () => {
						const testval: IID3V2.FrameValue.Text = {text: testValue};
						const result = await writebackandforth(val, {encoding: enc, value: testval}, tagHead);
						expect(result.value.text).to.equal(testValue);
						expect(result.head.encoding).to.equal(enc);
					});
				});
			});
		});
	});

	describe('IdText', () => {
		const val = FrameIdText;
		encs.forEach(enc => {
			describe('Endcoding: ' + enc, () => {
				testValues.forEach(testValue => {
					it('should write back & forth: ' + testValue, async () => {
						const testval: IID3V2.FrameValue.IdText = {id: '1234567890a', text: testValue};
						const result = await writebackandforth(val, {encoding: enc, value: testval}, tagHead);
						expect(result.head.encoding).to.equal(enc);
						expect(result.value.text).to.equal(testval.text);
						expect(result.value.id).to.equal(testval.id);
					});
				});
			});
		});
	});

	describe('IdAscii', () => {
		const val = FrameIdAscii;
		testValues.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.IdAscii = {id: '1234567890a', text: testValue};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.text).to.equal(testval.text);
				expect(result.value.id).to.equal(testval.id);
			});
		});
	});

	describe('LangDescText', () => {
		const val = FrameLangDescText;
		encs.forEach(enc => {
			describe('Endcoding: ' + enc, () => {
				testValues.forEach(testValue => {
					it('should write back & forth: ' + testValue, async () => {
						const testval: IID3V2.FrameValue.LangDescText = {
							id: 'sfdsfaglajegoeirjgoergere',
							language: 'eng',
							text: testValue
						};
						const result = await writebackandforth(val, {value: testval, encoding: enc}, tagHead);
						expect(result.head.encoding).to.equal(enc);
						expect(result.value.text).to.equal(testval.text);
						expect(result.value.language).to.equal(testval.language);
						expect(result.value.id).to.equal(testval.id);
					});
				});
			});
		});
	});

	describe('MusicCDId', () => {
		const val = FrameMusicCDId;
		testValues.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.Bin = {bin: BufferUtils.fromString(testValue)};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.bin.length).to.equal(testval.bin.length);
				expect(BufferUtils.compareBuffer(testval.bin, result.value.bin)).to.equal(true, 'Binary not equal ' + testval);
			});
		});
	});

	describe('IdBin', () => {
		const val = FrameIdBin;
		testValues.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.IdBin = {id: 'öösldfösfsfd', bin: BufferUtils.fromString(testValue)};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.id).to.equal(testval.id);
				expect(result.value.bin.length).to.equal(testval.bin.length);
				expect(BufferUtils.compareBuffer(testval.bin, result.value.bin)).to.equal(true);
			});
		});
	});

	describe('Popularimeter', () => {
		const val = FramePopularimeter;
		ints.forEach(testValue => {
			[0, 10, 254].forEach(rating => {
				it('should write back & forth: ' + testValue, async () => {
					const testval: IID3V2.FrameValue.Popularimeter = {email: 'öösldfösfsfd', rating: rating, count: testValue};
					const result = await writebackandforth(val, {value: testval}, tagHead);
					expect(result.value.email).to.equal(testval.email);
					expect(result.value.rating).to.equal(testval.rating);
					expect(result.value.count).to.equal(testval.count);
				});
			});
		});
	});

	describe('PartOfCompilation', () => {
		const val = FrameBooleanString;
		[false, true].forEach(testValue => {
			encs.forEach(enc => {
				describe('Endcoding: ' + enc, () => {
					it('should write back & forth: ' + testValue, async () => {
						const testval: IID3V2.FrameValue.Bool = {bool: testValue};
						const result = await writebackandforth(val, {value: testval, encoding: enc}, tagHead);
						expect(result.head.encoding).to.equal(enc);
						expect(result.value.bool).to.equal(testval.bool);
					});
				});
			});
		});
	});

	describe('Unknown', () => {
		const val = FrameUnknown;
		testValues.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.Bin = {bin: BufferUtils.fromString(testValue)};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.bin.length).to.equal(testval.bin.length);
				expect(BufferUtils.compareBuffer(testval.bin, result.value.bin)).to.equal(true);
			});
		});
	});

	describe('PlayCounter', () => {
		const val = FramePlayCount;
		ints.forEach(testValue => {
			it('should write back & forth: ' + testValue, async () => {
				const testval: IID3V2.FrameValue.Number = {num: testValue};
				const result = await writebackandforth(val, {value: testval}, tagHead);
				expect(result.value.num).to.equal(testval.num);
			});
		});
	});

	const pictypes: Array<{ key: number, name: string }> = Object.keys(ID3V2ValueTypes.pictureType).map(key => {
		return {key: parseInt(key, 10), name: ID3V2ValueTypes.pictureType[key]};
	});
	describe('Pic', () => {
		const val = FramePic;
		encs.forEach(enc => {
			describe('Endcoding: ' + enc, () => {
				pictypes.forEach(pictype => {
					describe('PicType: ' + pictype.name + ' (' + pictype.key + ')', () => {
						testValues.forEach(testValue => {
							it('should write back & forth: ' + testValue, async () => {
								const testobj = {
									value: {
										description: testValue,
										mimeType: 'this/that',
										pictureType: pictype.key,
										bin: BufferUtils.fromString(testValue)
									},
									encoding: enc
								};
								const result = await writebackandforth(val, testobj, tagHead);
								expect(result.value.description).to.equal(testobj.value.description);
								expect(result.value.mimeType).to.equal(testobj.value.mimeType);
								expect(result.value.pictureType).to.equal(testobj.value.pictureType);
								expect(result.head.encoding).to.equal(testobj.encoding);
							});
						});
					});
				});
			});
		});
	});
	setTimeout(() => {
		run(); // https://github.com/mochajs/mocha/issues/2221#issuecomment-214636042
	});
});
