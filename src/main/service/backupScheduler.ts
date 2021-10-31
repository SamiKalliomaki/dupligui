import cronParser from 'cron-parser';
import { app } from "electron";

import { CronScheduleConfig, DirectoryConfig } from "data/directoryConfig";
import { DirectoryListEntry } from "data/directories";
import { getDirectoryListConfig } from './directoryList';
import { getDirectoryConfigByPath, updateDirectoryConfigByPath } from './directoryConfig';
import { backupDirectory } from './backup';
import { eventBus } from './eventBus';

const kWhitespace = /\s+/g;
const kOneDayMs = 1000 * 60 * 60 * 24;

let nextBackupTimer: NodeJS.Timeout | null;

// Not sure if this should live here.
app.whenReady().then(async () => {
	await clearPendingBackups();
	await scheduleNextBackup();
});

eventBus.on('directoryConfigUpdate', () => {
	scheduleNextBackup();
});

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

	nextBackupTimer = setTimeout(executeBackups, timeout);
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

async function executeBackups() {
	let nextBackups = await calculateBackupTimes();

	let now = new Date();
	for (const nextBackup of nextBackups) {
		if (nextBackup.date <= now) {
			await backupDirectory(nextBackup.dir.path);
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
				lastBackupResult: 'Dupligui was closed while backup was ' + config.backupState + '.'
			});
		}
	}
}

function getCronExpression(config: CronScheduleConfig) {
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
