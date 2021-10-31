import child_process from 'child_process';
import util from 'util';
const execFile = util.promisify(child_process.execFile);

import { getDirectoryConfigByPath, updateDirectoryConfigByPath } from './directoryConfig';
import { addJob } from './jobs';

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
			let result = await doBackup(path);

			await updateDirectoryConfigByPath(path, {
				backupState: result.error ? 'error' : 'done',
				lastBackupResult: result.error ? result.error.message : 'Success!',
				lastBackupLog: 'Stderr:\n' + result.stderr + '\n\nStdout:\n' + result.stdout
			});
		} catch (e) {
			await updateDirectoryConfigByPath(path, {
				backupState: 'error',
				lastBackupResult: 'Error: ' + e.message,
			});
		}
	});
}

async function doBackup(path: string) {
	console.log('Backing up', path);

	try {
		let result = await execFile('duplicacy', ['backup', '--stats'], {
			cwd: path,
		})
		return {
			error: null,
			stdout: result.stdout,
			stderr: result.stderr,
		}
	} catch (e) {
		return {
			error: e,
			stdout: e.stdout || '',
			stderr: e.stderr || ''
		}
	}
}