import {loadSpec, omit, toNonBinJson} from '../common/common';
import Debug from 'debug';

import {IID3V2} from '../../src/lib/id3v2/id3v2.types';
import {ID3v2} from '../../src/lib/id3v2/id3v2';

const debug = Debug('id3v2-test');

function compareID3v2SpecFrame(filename: string, framespec: any, frame: IID3V2.Frame) {
	const frameHead = frame.head;
	expect(frameHead).toBeTruthy();
	if (!frameHead) {
		return;
	}
	const formatFlags = frameHead.formatFlags || {};
	if (framespec.formatFlags) {
		Object.keys(framespec.formatFlags).forEach(flag => {
			expect(formatFlags[flag]).toBe(framespec.formatFlags[flag]); // 'Flag values not equal for frame ' + framespec.id + ' flag ' + flag + ' frame: ' + JSON.stringify(frame));
		});
	}
	Object.keys(formatFlags).forEach(flag => {
		if (formatFlags[flag]) {
			expect(framespec.formatFlags).toBeTruthy(); //  'SpecError: Flag values must be specified for frame ' + framespec.id + ' flag ' + flag);
			expect(formatFlags[flag]).toBe(framespec.formatFlags[flag]); // 'SpecError: All Flag values must be correctly specified for frame ' + framespec.id + ' flag ' + flag);
		}
	});
	if (framespec.binSize !== undefined) {
		expect((<any>frame.value).bin.length).toBe(framespec.binSize);
	}
	if (!framespec.invalid) {
		// expect(frame.value).excludingEvery(['bin']).to.deep.equal(framespec.value, 'Values not equal for frame ' + framespec.id + ' ' + toNonBinJson(frame));
		expect(omit(frame.value, ['bin'])).toEqual(omit(framespec.value, ['bin'])); // 'Values not equal for frame ' + framespec.id + ' ' + toNonBinJson(frame));
	} else {
		expect(frame.invalid).toBeTruthy();
	}
	if (framespec.size !== undefined) {
		expect(frameHead.size).toBe(framespec.size); // 'Invalid size for frame ' + framespec.id + toNonBinJson(frame));
	}
	if (framespec.groupId !== undefined) {
		expect(frame.groupId).toBe(framespec.groupId); // 'Invalid groupId for frame ' + framespec.id);
	}
	if (framespec.subframes) {
		expect(frame.subframes).toBeTruthy();
		if (frame.subframes) {
			compareID3v2SpecFrames(filename, framespec.subframes, frame.subframes);
		}
	}
}

function compareID3v2SpecFrames(filename: string, specframes: Array<any>, frames: Array<IID3V2.Frame>) {
	(specframes || []).forEach((framespec: any) => {
		const list: Array<IID3V2.Frame> = frames.filter(f => f.id === framespec.id);
		if (list.length === 0) {
			throw new Error('Spec frame not found:' + JSON.stringify(framespec));
		} else if (list.length === 1) {
			compareID3v2SpecFrame(filename, framespec, list[0]);
		} else {
			let sublist = [];
			if (['POPM'].indexOf(framespec.id) >= 0) {
				sublist = list.filter(f => (<any>f.value).email === framespec.value.email);
				if (sublist.length !== 1) {
					throw new Error('Spec frame not found:' + JSON.stringify(framespec));
				}
			} else if (['GEOB'].indexOf(framespec.id) >= 0) {
				sublist = list;
				if (sublist.length > 1) {
					let done = false;
					let nr = -1;
					specframes.forEach(sf => {
						if (!done) {
							if (sf.id === framespec.id) {
								nr++;
							}
							if (sf === framespec) {
								done = true;
							}
						}
					});
					sublist[0] = sublist[nr];
				}
			} else if (['APIC', 'PIC'].indexOf(framespec.id) >= 0) {
				sublist = list.filter(f => (<any>f.value).pictureType === framespec.value.pictureType);
				if (sublist.length < 1) {
					throw new Error('Spec frame not found:' + JSON.stringify(framespec));
				}
				if (sublist.length > 1) {
					let done = false;
					let nr = -1;
					specframes.forEach(sf => {
						if (!done) {
							if (sf.id === framespec.id && sf.value.pictureType === framespec.value.pictureType) {
								nr++;
							}
							if (sf === framespec) {
								done = true;
							}
						}
					});
					sublist[0] = sublist[nr];
				}
			} else if (['TIT2', 'TPE1', 'TALB', 'TRCK', 'TRK'].indexOf(framespec.id) >= 0) {
				sublist = list.filter(f => (<any>f.value).text === framespec.value.text);
				if (sublist.length < 1) {
					throw new Error('Spec frame not found:' + JSON.stringify(framespec));
				}
				if (sublist.length > 1) {
					let done = false;
					let nr = -1;
					specframes.forEach(sf => {
						if (!done) {
							if (sf.id === framespec.id) {
								nr++;
							}
							if (sf === framespec) {
								done = true;
							}
						}
					});
					sublist[0] = sublist[nr];
				}
			} else if (['WOAR'].indexOf(framespec.id) >= 0) {
				sublist = list.filter(f => (<any>f.value).text === framespec.value.text);
				if (sublist.length !== 1) {
					throw new Error('Spec frame not found:' + JSON.stringify(framespec));
				}
			} else if (['TXXX', 'PRIV', 'WXXX', 'CHAP', 'CTOC', 'COMM', 'COM', 'RVA2', 'TRC'].indexOf(framespec.id) >= 0) {
				sublist = list.filter(f => (<any>f.value).id === framespec.value.id);
				if (sublist.length > 1) {
					let done = false;
					let nr = -1;
					specframes.forEach(sf => {
						if (!done) {
							if (sf.id === framespec.id) {
								nr++;
							}
							if (sf === framespec) {
								done = true;
							}
						}
					});
					sublist[0] = sublist[nr];
				} else if (sublist.length !== 1) {
					throw new Error('Spec frame not found:' + JSON.stringify(framespec) + toNonBinJson(frames));
				}
			} else {
				throw new Error('TODO: Implement Spec matching:' + JSON.stringify(framespec));
			}
			compareID3v2SpecFrame(filename, framespec, sublist[0]);
		}
	});
}

export async function compareID3v2Spec(filename: string, tag: IID3V2.Tag | undefined): Promise<void> {
	const spec = await loadSpec(filename);
	if (!spec.id3v2) {
		if (tag) {
			if (tag.head) {
				expect(tag.head.valid).toBe(false); // , 'Spec needs tag to be invalid ' + toNonBinJson(tag));
			}
		}
		return;
	}
	expect(tag).toBeTruthy();
	if (!tag) {
		return;
	}
	expect(tag.head).toBeTruthy();
	if (tag.head) {
		expect(tag.head.ver).toBe(spec.id3v2.ver); // 'wrong id3v2 version');
	}
	compareID3v2SpecFrames(filename, spec.id3v2.frames, tag.frames);
	expect(tag.frames.length).toBe(spec.id3v2.frames ? spec.id3v2.frames.length : 0); // 'Invalid frame count ' + toNonBinJson(tag.frames));
}

export async function testLoadSaveSpec(filename: string): Promise<void> {
	const id3 = new ID3v2();
	debug('LoadSaveSpec', 'loading', filename);
	let tag = await id3.read(filename);
	if (tag && tag.head && !tag.head.valid) {
		console.log('invalid id3v2 tag found', filename);
		tag = undefined;
	}
	expect(tag).toBeTruthy();
	if (!tag) {
		return;
	}
	expect(tag.head).toBeTruthy();
	await compareID3v2Spec(filename, tag);
}
