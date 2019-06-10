<a name="0.3.10"></a>
# 0.3.10 (2019/06/10)
### Bug Fixes
* MP3.removeTags/ID3v2.updateTag: remove padding between id3v2 and audio

### Features
ID3v2.write(): optional padding size parameter

<a name="0.3.9"></a>
# 0.3.9 (2019/06/04)
### Features
* MP3.removeTags: returns report obj if and which tags are removed
`async removeTags(filename: string, opts: IMP3.RemoveTagsOptions): Promise<{ id3v2: boolean, id3v1: boolean } | undefined>`

<a name="0.3.8"></a>
# 0.3.8 (2019/06/04)
### Features
* ID3v1.write: add optional "keepBackup:boolean" parameter to keep the ${filename}.bak file which is created while writing (if it does not already exists)

### Bug Fixes
* ID3v1.write: did not properly update existing files

<a name="0.3.7"></a>
# 0.3.7 (2019/06/03)
### Features
* ID3v2.write: add optional "keepBackup:boolean" parameter to keep the ${filename}.bak file which is created while writing (if it does not already exists)
* MP3.removeTags: add MP3.removeTags(filename, {id3v2:boolean, id3v1:boolean, keepBackup:boolean}) for stripping tags
* ITagID enum: add ITagID string enum (ID3v2 | ID3v1)

### Bug Fixes
* ID3v2: correct position in ID3v2.end 

<a name="0.3.6"></a>
# 0.3.6 (2019/05/31)
### Features
* MP3 Analyze/Reader: use even less heap space collecting mpeg frame headers
* export ID3v1.GENRES on root index

<a name="0.3.5"></a>
# 0.3.5 (2019/05/27)

### Features
* ID3V24TagBuilder: support for PRIV frames with 'priv(id, binary)'
* MP3 Analyze/Reader: use less heap space collecting mpeg frame headers

### BREAKING
* ID3V24TagBuilder: renamed 'addPicture' to 'picture'