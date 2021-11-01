import { AppConfig, DirectoryStats, DuplicacySnapshotListEntry, FormError, SelectDirectoryResult } from "data/ipc";
import { DirectoryListConfig, DirectoryListEntry } from "./directories";
import { DirectoryConfig } from "./directoryConfig";

export interface IpcApi {
	// directoryList
	selectDirectory: () => Promise<SelectDirectoryResult>;
	addDirectory: (directory: DirectoryListEntry) => Promise<null | FormError>;
	removeDirectory: (directory: DirectoryListEntry) => Promise<void>;

	// directoryConfig
	getDirectoryConfig: (name: string) => Promise<DirectoryConfig>;
	updateDirectoryConfig: (name: string, updates: Partial<DirectoryConfig>) => Promise<void>;
	getDirectoryStats: (name: string) => Promise<DirectoryStats>;

	// appConfig
	getAppConfig: () => Promise<AppConfig>;
	setAppConfig: (newConfig: AppConfig) => Promise<void>;

	// backup
	getBackupLog: (name: string) => Promise<string>;

	// duplicacy
	getSnapshotList: (dirName: string) => Promise<ReadonlyArray<DuplicacySnapshotListEntry>>;
}

export interface IpcObservables {
	directories: DirectoryListConfig
}