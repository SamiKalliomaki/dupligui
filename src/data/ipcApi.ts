import { AppConfig, DirectoryStats, FormError, SelectDirectoryResult } from "data/ipc";
import { DirectoryListConfig, DirectoryListEntry } from "./directories";
import { DirectoryConfig } from "./directoryConfig";

export interface IpcApi {
	selectDirectory: () => Promise<SelectDirectoryResult>;
	addDirectory: (directory: DirectoryListEntry) => Promise<null | FormError>;
	removeDirectory: (directory: DirectoryListEntry) => Promise<void>;

	getDirectoryConfig: (name: string) => Promise<DirectoryConfig>;
	updateDirectoryConfig: (name: string, updates: Partial<DirectoryConfig>) => Promise<void>;
	getDirectoryStats: (name: string) => Promise<DirectoryStats>;

	getAppConfig: () => Promise<AppConfig>;
	setAppConfig: (newConfig: AppConfig) => Promise<void>;

	getBackupLog: (name: string) => Promise<string>;
}

export interface IpcObservables {
	directories: DirectoryListConfig
}