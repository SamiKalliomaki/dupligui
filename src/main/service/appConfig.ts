import { promises as fsasync } from "fs";
import { app } from "electron";
import path from "path";

import { AppConfig } from "data/appConfig";
import { kPrettyWriteIndent } from "data/util";
import { Observable } from "../ipc/observable";

const kAppConfigFile = path.join(app.getPath('userData'), 'app-config.json');

const appConfig: Observable<'appConfig'> = new Observable('appConfig', loadAppConfig)

export async function getAppConfig() {
	return appConfig.getValue();
}

export async function updateAppConfig(update: Partial<AppConfig>) {
	let config = await getAppConfig();
	appConfig.setValue({
		...config,
		...update
	});
	await registerOpenOnLogin();
	await saveAppConfig();
}

export async function registerOpenOnLogin() {
	let config = await getAppConfig();
	app.setLoginItemSettings({
		openAtLogin: config.openAtLogin
	});
}

export function unregisterOpenOnLogin() {
	app.setLoginItemSettings({
		openAtLogin: false
	});
}

// Helpers
async function loadAppConfig(): Promise<AppConfig> {
	try {
		let directoriesString = await fsasync.readFile(kAppConfigFile, 'utf-8');
		return AppConfig.sanitize(JSON.parse(directoriesString));
	} catch (e) {
		console.log('Failed to load directory list, using default.', e);
		return AppConfig.kDefault;
	}
};

async function saveAppConfig() {
	let dirs = appConfig.value
	if (dirs == null) {
		return;
	}
	await fsasync.writeFile(
		kAppConfigFile, JSON.stringify(dirs, null, kPrettyWriteIndent), 'utf-8');
}