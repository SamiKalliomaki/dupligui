import child_process from 'child_process';
import path from 'path';
import util from 'util';
const execFile = util.promisify(child_process.execFile);

import { kDuplicacyDir } from 'data/util';
import { getDirectoryConfigByPath, updateDirectoryConfigByPath } from './directoryConfig';
import { runDuplicacy } from './duplicacy';
import { addJob } from './jobs';

const kBackupLogFileName = 'backup-log.txt';

export function getBackupLogFilename(dirPath: string): string {
	return path.join(dirPath, kDuplicacyDir, kBackupLogFileName);
}

export async function backupDirectory(path: string): Promise<void> {
	let config = await getDirectoryConfigByPath(path);
	switch (config.backupState) {
		case 'pending':
		case 'executing':
			return;
		case 'idle':
		case 'done':
		case 'error':
			break;
		default:
			throw new Error('Unknown backup state: ' + config.backupState);
	}
	await updateDirectoryConfigByPath(path, {
		backupState: 'pending'
	});

	addJob(async () => {
		await updateDirectoryConfigByPath(path, {
			lastBackup: new Date().toISOString(),
			backupState: 'executing'
		});

		try {
			await doBackup(path);
			await updateDirectoryConfigByPath(path, {
				backupState: 'done',
				lastBackupResult: 'Success!',
			});
		} catch (e) {
			await updateDirectoryConfigByPath(path, {
				backupState: 'error',
				lastBackupResult: 'Error: ' + e.message,
			});
		}
	});
}

function doBackup(dirPath: string): Promise<void> {
	console.log('Backing up', dirPath);
	return runDuplicacy(['backup', '--stats'], dirPath, getBackupLogFilename(dirPath));
}