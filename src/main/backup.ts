import cronParser from 'cron-parser';
import child_process from 'child_process';
import util from 'util';

const execFile = util.promisify(child_process.execFile);

import { CronScheduleConfig, DirectoryConfig } from "data/directoryConfig";
import { getDirectoryListConfig } from "./ipc/directories";
import { getDirectoryConfigByPath, updateDirectoryConfigByPath } from "./ipc/directoryConfig";
import { DirectoryListEntry } from "data/directories";
import { addJob } from "./jobs";
import { app } from "electron";

const kWhitespace = /\s+/g;
const kOneDayMs = 1000 * 60 * 60 * 24;

let nextBackupTimer: NodeJS.Timeout | null;

export function getCronExpression(config: CronScheduleConfig) {
	return [
		config.second,
		config.minute,
		config.hour,
		config.dayOfMonth,
		config.month,
		config.dayOfWeek
	].map(v => v.replace(kWhitespace, '')).join(' ')
}

function minDate(a: Date | null, b: Date | null): Date | null {
	return ((a && b) && a < b ? a : b) || a || b;
}

function maxDate(a: Date | null, b: Date | null): Date | null {
	return ((a && b) && a > b ? a : b) || a || b;
}

export function calculateNextBackup(config: DirectoryConfig): Date | null {
	if (!config.backupEnabled) {
		return null;
	}
	if (config.backupState !== 'idle'
		&& config.backupState !== 'done'
		&& config.backupState !== 'error') {
		return null;
	}

	try {
		let current = maxDate(
			config.lastBackup ? new Date(config.lastBackup) : null,
			config.lastModified ? new Date(config.lastModified) : null)
			|| new Date();
		return cronParser.parseExpression(getCronExpression(config.backupSchedule), {
			currentDate: current,
		}).next().toDate();
	} catch (e) {
		console.error('Failed to calculate next backup:', e)
		return null;
	}
}

async function calculateBackupTimes(): Promise<{
	date: Date;
	dir: DirectoryListEntry;
	config: DirectoryConfig;
}[]> {
	const directories = (await getDirectoryListConfig()).directories

	let configs: {
		dir: DirectoryListEntry;
		config: DirectoryConfig;
	}[] = []
	for (const directory of directories) {
		let config;
		try {
			config = await getDirectoryConfigByPath(directory.path);
		} catch (e) {
			console.error('Failed to get directory config for calculating next backup:', e);
			continue;
		}
		configs.push({
			dir: directory,
			config: config
		});
	}

	return configs.flatMap((entry) => {
		let date = calculateNextBackup(entry.config);
		if (date === null)
			return [];

		return [{
			date: date,
			dir: entry.dir,
			config: entry.config
		}];
	});
}

export async function scheduleNextBackup() {
	let nextBackups = await calculateBackupTimes();

	let nextBackup = nextBackups
		.map(v => v.date)
		.reduce(minDate, null);
	console.log('Next backup will be:', nextBackup);
	if (nextBackupTimer != null) {
		clearTimeout(nextBackupTimer);
		nextBackupTimer = null;
	}

	if (nextBackup == null) {
		return;
	}
	let timeout = nextBackup.getTime() - Date.now();
	if (timeout > kOneDayMs) {
		timeout = kOneDayMs;
	}

	nextBackupTimer = setTimeout(checkBackup, timeout);
}

async function doBackup(dir: DirectoryListEntry) {
	console.log('Backing up', dir.name, 'at', dir.path);

	try {
		let result = await execFile('duplicacy', ['backup', '--stats'], {
			cwd: dir.path,
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

async function createBackupJob(dir: DirectoryListEntry) {
	let config = await getDirectoryConfigByPath(dir.path);
	if (config.backupState !== 'idle'
		&& config.backupState !== 'done'
		&& config.backupState !== 'error') {
		return;
	}
	await updateDirectoryConfigByPath(dir.path, {
		backupState: 'pending'
	});

	addJob(async () => {
		await updateDirectoryConfigByPath(dir.path, {
			lastBackup: new Date().toISOString(),
			backupState: 'executing'
		});

		try {
			let result = await doBackup(dir);

			await updateDirectoryConfigByPath(dir.path, {
				backupState: result.error ? 'error' : 'done',
				lastBackupResult: result.error ? result.error.message : 'Success!',
				lastBackupLog: 'Stderr:\n' + result.stderr + '\n\nStdout:\n' + result.stdout
			});
		} catch (e) {
			await updateDirectoryConfigByPath(dir.path, {
				backupState: 'error',
				lastBackupResult: 'Error: ' + e.message,
			});
		} finally {
			await scheduleNextBackup();
		}
	});
}

async function checkBackup() {
	let nextBackups = await calculateBackupTimes();

	let now = new Date();
	for (const nextBackup of nextBackups) {
		if (nextBackup.date <= now) {
			await createBackupJob(nextBackup.dir);
		}
	}

	await scheduleNextBackup();
}

async function clearPendingBackups() {
	const directories = (await getDirectoryListConfig()).directories
	for (const directory of directories) {
		let config;
		try {
			config = await getDirectoryConfigByPath(directory.path);
		} catch (e) {
			console.error('Failed to get directory config when clearing pending backups:', e);
			continue;
		}

		if (config.backupState === 'pending' || config.backupState === 'executing') {
			await updateDirectoryConfigByPath(directory.path, {
				backupState: 'error',
				lastBackupResult: 'Dupligui was while backup was ' + config.backupState + '.'
			});
		}
	}
}

app.whenReady().then(async () => {
	await clearPendingBackups();
	await scheduleNextBackup();
});