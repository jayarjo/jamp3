import {should} from 'chai';
import Debug from 'debug';

import {compareID3v2Save} from './id3v2_test_compare';
import {ID3v2} from '../../src/lib/id3v2/id3v2';

const debug = Debug('id3v2-test');

export async function testLoadSaveCompare(filename: string): Promise<void> {
	debug('LoadSaveCompare', 'loading', filename);
	const id3 = new ID3v2();
	let tag = await id3.read(filename);
	if (tag && tag.head && !tag.head.valid) {
		console.log('invalid id3v2 tag found', filename);
		tag = undefined;
	}
	should().exist(tag);
	if (!tag) {
		return;
	}
	should().exist(tag.head);
	await compareID3v2Save(filename, tag);
}
