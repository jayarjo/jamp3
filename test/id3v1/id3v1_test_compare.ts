import {expect, should, use} from 'chai';
import chaiExclude from 'chai-exclude';
import fse from 'fs-extra';
import tmp from 'tmp';
import Debug from 'debug';

import {ID3v1} from '../../src/lib/id3v1/id3v1';
import {IID3V1} from '../../src/lib/id3v1/id3v1.types';
import {ITagID} from '../../src/lib/common/types';
import {loadSpec, wait} from '../common/common';

use(chaiExclude);
const debug = Debug('id3v1-test');

async function compareTags(a: IID3V1.Tag, b: IID3V1.Tag): Promise<void> {
	expect(b.version).to.equal(a.version);
	expect(b.value).to.deep.equal(a.value);
}

export async function compareID3v1Spec(filename: string, tag: IID3V1.Tag | undefined): Promise<void> {
	const spec = await loadSpec(filename);
	if (!spec || !spec.id3v1) {
		should().not.exist(tag, 'Missing ID3v1 spec ' + JSON.stringify({id3v1: tag}));
		return;
	}
	if (!tag && spec.id3v1.fail) {
		return;
	}
	should().exist(tag);
	if (!tag) {
		return;
	}
	expect(tag.value).to.deep.equal(spec.id3v1.value);
	expect(tag.version).to.equal(spec.id3v1.version, 'wrong id3v1 version');
}

const mockTag: IID3V1.Tag = {
	id: ITagID.ID3v1,
	start: 0,
	end: 0,
	version: 1,
	value: {
		title: 'TITLETITEL',
		artist: 'ARTISTARTIST',
		comment: 'COMMENT',
		album: 'ALBUM',
		genreIndex: 1,
		year: 'YEAR',
		track: 99
	}
};

export async function compareID3v1Save(filename: string, tag: IID3V1.Tag): Promise<void> {
	const file = tmp.fileSync();
	await fse.remove(file.name);
	debug('writing', file.name);
	try {
		const id3 = new ID3v1();
		await id3.write(file.name, tag.value, tag.version || 0, {keepBackup: false});
	} catch (e) {
		file.removeCallback();
		return Promise.reject(e);
	}
	debug('loading', file.name);
	try {
		const id3 = new ID3v1();
		const tag2 = await id3.read(file.name);
		should().exist(tag2);
		if (tag2) {
			await compareTags(tag, tag2);
		}
	} catch (e) {
		file.removeCallback();
		return Promise.reject(e);
	}
	file.removeCallback();
}

export async function testOverWriteMock(filename: string): Promise<void> {
	const file = tmp.fileSync();
	await fse.remove(file.name);
	await fse.copy(filename, file.name);
	debug('writing', file.name);
	try {
		const id3 = new ID3v1();
		await id3.write(file.name, mockTag.value, mockTag.version || 0, {keepBackup: false});
	} catch (e) {
		file.removeCallback();
		return Promise.reject(e);
	}
	debug('loading', file.name);
	try {
		const id3 = new ID3v1();
		let tag2 = await id3.read(file.name);
		if (!tag2) {
			await wait();
			tag2 = await id3.read(file.name);
		}
		should().exist(tag2);
		if (tag2) {
			await compareTags(mockTag, tag2);
		}
	} catch (e) {
		file.removeCallback();
		return Promise.reject(e);
	}
	file.removeCallback();
}
