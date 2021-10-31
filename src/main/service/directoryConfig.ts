import path from "path";
import fs from "fs";
import { promises as fsasync } from "fs";

import { kPrettyWriteIndent, kDuplicacyDir } from "data/util";
import { DirectoryConfig } from "data/directoryConfig";
import { getDirectoryPath } from "./directoryList";
import { eventBus } from "./eventBus";

const kDirectoryConfigName = 'dupligui.json';

let directoryConfigs: {
	[path in string]: Promise<DirectoryConfig>
} = {}

export async function getDirectoryConfig(name: string) {
	return getDirectoryConfigByPath(await getDirectoryPath(name));
}

export async function getDirectoryConfigByPath(dirPath: string): Promise<DirectoryConfig> {
	if (dirPath in directoryConfigs) {
		return directoryConfigs[dirPath];
	}
	return directoryConfigs[dirPath] = loadDirectoryConfig(dirPath);
}

export async function updateDirectoryConfigByPath(
	dirPath: string,
	updates: Partial<DirectoryConfig>) {
	let oldConfig = await getDirectoryConfigByPath(dirPath);
	let newConfig = { ...oldConfig, ...updates };
	directoryConfigs[dirPath] = Promise.resolve(newConfig);
	await saveDirectoryConfig(dirPath, newConfig);

	eventBus.emit('directoryConfigUpdate');
}

// Helpers
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