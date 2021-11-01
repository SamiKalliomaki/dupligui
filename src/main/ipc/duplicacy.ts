import path from 'path';

import { DuplicacyDirectoryEntry, DuplicacyFileEntry, DuplicacySnapshotListEntry } from "data/ipc";
import { getDirectoryPath } from "../service/directoryList";
import { runDuplicacyWithOutput } from "../service/duplicacy";
import { handleIpc } from "./util";

const kSnapshotListRegex = /^Snapshot .+ revision (\d+) created at (.*[^\s])\s*$/;
const kFileListRegex = /^\s*(\d+) ([^\s]+ [^\s]+) ([^\s]*)\s+([^\s](.*[^\s])?)$/;

handleIpc('getSnapshotList', async (event, name) => {
	let output = await runDuplicacyWithOutput(['list'], await getDirectoryPath(name), null);

	const result: DuplicacySnapshotListEntry[] = []
	for (const line of output.split('\n')) {
		const match = line.match(kSnapshotListRegex);
		if (match === null)
			continue;

		result.push({
			revision: Number.parseInt(match[1]),
			date: match[2],
		});
	}

	result.sort((a, b) => b.revision - a.revision);
	return result;
});

handleIpc('getSnapshotFileList', async (event, dirName, revision) => {
	let output = await runDuplicacyWithOutput([
		'list', '-r', revision.toString(), '-files'], await getDirectoryPath(dirName), null);

	const resultRoot: DuplicacyDirectoryEntry = {
		subdirs: {},
		files: {},
		fullPath: '',
		name: '',
		size: 0,
	}
	for (const line of output.split('\n')) {
		const match = line.match(kFileListRegex);
		if (match === null)
			continue;

		const file: DuplicacyFileEntry = {
			size: Number.parseInt(match[1]),
			modificationDate: match[2],
			hash: match[3],
			fullPath: match[4],
			name: path.posix.basename(match[4]),
		}

		const pathDirs = match[4].split('/');
		// Remove filename.
		pathDirs.pop();

		let curDir = resultRoot;
		let fullPath = '';

		for (const pathDir of pathDirs) {
			fullPath += '/' + pathDir;

			if (!(pathDir in curDir.subdirs)) {
				curDir.subdirs[pathDir] = {
					subdirs: {},
					files: {},
					name: pathDir,
					fullPath: fullPath,
					size: 0,
				}
			}
			curDir.size += file.size;
			curDir = curDir.subdirs[pathDir];
		}
		curDir.size += file.size;
		curDir.files[file.name] = file
	}

	return resultRoot;
});