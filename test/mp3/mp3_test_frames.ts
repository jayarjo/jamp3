import fse from 'fs-extra';
import {expect, should} from 'chai';
import Debug from 'debug';
import {IMP3, MP3} from '../../src';
import {ITestSpec, ITestSpecFrame} from '../common/test-spec';
import {filterBestMPEGChain} from '../../src/lib/mp3/mp3_frames';
import {expandRawHeader, expandRawHeaderArray, rawHeaderOffSet} from '../../src/lib/mp3/mp3_frame';

const debug = Debug('mp3-test');

async function loadFramesCompareProbe(filename: string, result: IMP3.Result): Promise<void> {
	const compare: ITestSpec = await fse.readJSON(filename + '.frames.json');
	const comparecols = compare.cols || [];
	const compareframes: Array<ITestSpecFrame> = (compare.frames || []).map(row => {
		const o: any = {};
		comparecols.forEach((key, index) => {
			o[key] = row[index];
		});
		return <ITestSpecFrame>o;
	});
	// saveIfNotExists(filename + '.frames.jam.json', result.frames);
	const allframes = result.frames && result.frames.audio ? result.frames.audio || [] : [];
	let frames = filterBestMPEGChain(allframes, 50);
	const head = result.frames && result.frames.headers ? result.frames.headers[0] : undefined;
	if (head) {
		const j = compareframes.findIndex(f => f.offset === head.header.offset);
		if (j < 0) {
			// probe removes xing frames sometimes
			frames = frames.filter(f => rawHeaderOffSet(f) !== head.header.offset);
		}
	}
	// saveIfNotExists(filename + '.frames.jam.filtered.json', frames);
	if (frames.length !== compareframes.length) {
		const missing: Array<number> = [];
		frames.forEach(frame => {
			if (!compareframes.find(f => f.offset === rawHeaderOffSet(frame))) {
				missing.push(rawHeaderOffSet(frame));
			}
		});
		if (missing.length > 0) {
			// console.log('missing frame offsets in probe', missing);
			frames = frames.filter(f => {
				return missing.indexOf(rawHeaderOffSet(f)) < 0;
			});
		}
		const missing2: Array<number> = [];
		compareframes.forEach(frame => {
			if (!frames.find(f => rawHeaderOffSet(f) === frame.offset)) {
				missing2.push(frame.offset);
			}
		});
		if (missing2.length > 0) {
			// console.log('missing frame offsets in jam', missing2);
		}
	}
	frames.forEach((frame, index) => {
		const compareframe = compareframes[index];
		if (!compareframe) {
			return;
		}
		const header: IMP3.FrameHeader = expandRawHeader(expandRawHeaderArray(frame));
		if ((index > 0) && index < frames.length - 2) {
			// ignore last calculated size (ffprobe reports the real size, which may be smaller)
			expect(header.size).to.deep.equal(compareframe.size, 'Size not equal ' + index + ': ' + JSON.stringify(frame) + ' ' + JSON.stringify(compareframe));
			expect(header.samples).to.deep.equal(compareframe.samples, 'Nr of samples not equal ' + index + ': ' + JSON.stringify(frame) + ' ' + JSON.stringify(compareframe));
		}
		expect(header.offset).to.deep.equal(compareframe.offset, 'Header position not equal ' + index + ': ' + JSON.stringify(frame) + ' ' + JSON.stringify(compareframe));
		expect(header.channelCount).to.deep.equal(compareframe.channels, 'Channels not equal ' + index + ': ' + JSON.stringify(frame) + ' ' + JSON.stringify(compareframe));
	});
	expect(frames.length).to.equal(compareframes.length, 'Frame lengths not equal');
	if (compare.stream && result.mpeg) {
		expect(frames.length).to.equal(parseInt(compare.stream.nb_read_frames, 10), 'nb_read_frames not equal');
		expect(result.mpeg.sampleRate).to.equal(parseInt(compare.stream.sample_rate, 10), 'sampleRate not equal');
		expect(result.mpeg.channels).to.equal(compare.stream.channels, 'channels not equal');
		expect('MP3 (' + result.mpeg.layer + ')').to.equal(compare.stream.codec_long_name, 'codec_long_name not equal');
		let time = 0;
		compareframes.forEach(f => {
			time += f.time;
		});
		time = Math.trunc(time) / 1000;
		if (frames.length > 30 && time !== result.mpeg.durationRead) {
			const diff = parseFloat(Math.abs((parseFloat(compare.stream.duration) - result.mpeg.durationEstimate)).toFixed(5));
			expect(diff < 1).to.deep.equal(true, 'Estimated duration differs to much. diff: ' + diff + ' actual: ' + result.mpeg.durationEstimate + ' expected:' + compare.stream.duration);
		}
	}
}

export async function testFrames(filename: string): Promise<void> {
	debug('mp3test', 'loading', filename);
	const mp3 = new MP3();
	const result = await mp3.read(filename, {mpeg: true, id3v2: true});
	should().exist(result);
	if (!result || !result.frames) {
		return;
	}
	const exists = await fse.pathExists(filename + '.frames.json');
	if (exists) {
		await loadFramesCompareProbe(filename, result);
	} else {
		throw new Error('Testset incomplete, missing filename.frames.json');
	}
}
