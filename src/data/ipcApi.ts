import { DirectoryStats, DuplicacyDirectoryEntry, DuplicacySnapshotListEntry, FormError, SelectDirectoryResult } from "data/ipc";
import { AppConfig } from "./appConfig";
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
	updateAppConfig: (newConfig: AppConfig) => Promise<void>;

	// backup
	getBackupLog: (name: string) => Promise<string>;

	// duplicacy
	getSnapshotList: (dirName: string) => Promise<ReadonlyArray<DuplicacySnapshotListEntry>>;
	getSnapshotFileList: (dirName: string, revision: number) => Promise<DuplicacyDirectoryEntry>;
}

export interface IpcObservables {
	directories: DirectoryListConfig;
	appConfig: AppConfig;
}