import path from "path";
import fs from "fs";
import { promises as fsasync } from "fs";

import { DirectoryConfig } from "data/directoryConfig";
import { DirectoryStats } from "data/ipc";
import { getDirectoryListConfig } from "./directories";
import { handleIpc } from "./util";
import { kDuplicacyDir, kPrettyWriteIndent } from "data/util";
import { calculateNextBackup, scheduleNextBackup } from "../backup";

const kDirectoryConfigName = 'dupligui.json';

let directoryConfigs: {
	[path in string]: Promise<DirectoryConfig>
} = {}

async function loadDirectoryConfig(dirPath: string): Promise<DirectoryConfig> {
	let duplicacyDir = path.join(dirPath, kDuplicacyDir);
	try {
		await fsasync.access(duplicacyDir, fs.constants.R_OK);
	} catch (e) {
		throw new Error('Failed to access config: ' + e);
	}

	let configFile = path.join(dirPath, kDuplicacyDir, kDirectoryConfigName);
	try {
		let fileContents = await fsasync.readFile(configFile, 'utf-8');
		return DirectoryConfig.sanitize(JSON.parse(fileContents));
	} catch (e) {
		console.log('Failed to parse directory config, using default.', e);
		return DirectoryConfig.kDefault;
	}
}

async function saveDirectoryConfig(dirPath: string, config: DirectoryConfig): Promise<void> {
	let configFile = path.join(dirPath, kDuplicacyDir, kDirectoryConfigName);
	let fileContents = JSON.stringify(config, null, kPrettyWriteIndent);
	await fsasync.writeFile(configFile, fileContents, 'utf-8');
}

async function getDirPath(name: string): Promise<string> {
	let directoryList = await getDirectoryListConfig();
	let entry = directoryList.directories.find(v => v.name == name);
	if (entry === undefined) {
		throw new Error('Unknown directory.');
	}
	return entry.path;
}

export async function getDirectoryConfigByPath(dirPath: string): Promise<DirectoryConfig> {
	if (dirPath in directoryConfigs) {
		return directoryConfigs[dirPath];
	}
	return directoryConfigs[dirPath] = loadDirectoryConfig(dirPath);
}

async function getDirectoryConfig(name: string) {
	return getDirectoryConfigByPath(await getDirPath(name));
}

export async function updateDirectoryConfigByPath(
	dirPath: string,
	updates: Partial<DirectoryConfig>) {
	let oldConfig = await getDirectoryConfigByPath(dirPath);
	let newConfig = { ...oldConfig, ...updates };
	directoryConfigs[dirPath] = Promise.resolve(newConfig);

	await saveDirectoryConfig(dirPath, newConfig);
}

handleIpc('getDirectoryConfig', async (event, name) => {
	return getDirectoryConfig(name);
});

handleIpc('updateDirectoryConfig', async (event, name, updates) => {
	const dirPath = await getDirPath(name);
	await updateDirectoryConfigByPath(dirPath, updates);
	scheduleNextBackup();
});

handleIpc('getDirectoryStats', async (event, name) => {
	const dirPath = await getDirPath(name);
	let config = await getDirectoryConfigByPath(dirPath);

	const result: DirectoryStats = {
		directoryConfig: config,
		nextBackup: calculateNextBackup(config)?.toISOString() || null,
	};
	return result;
});