import { DirectoryConfig } from "./directoryConfig";

export interface SelectDirectoryResult {
	cancelled: boolean;
	path: string;
}

export interface SingleFormError {
	field?: string;
	message: string;
}

export interface FormError {
	formErrors: SingleFormError[]
}

export interface DirectoryStats {
	directoryConfig: DirectoryConfig,
	nextBackup: string | null,
}

export interface AppConfig {
	openAtLogin: boolean
}

export interface DuplicacySnapshotListEntry {
	revision: number,
	date: string
}

export interface DuplicacyDirectoryEntry {
	subdirs: {
		[name in string]: DuplicacyDirectoryEntry
	},
	files: {
		[name in string]: DuplicacyFileEntry
	},

	fullPath: string,
	name: string,
	size: number,
}

export interface DuplicacyFileEntry {
	size: number,
	modificationDate: string,
	hash: string,
	fullPath: string,
	name: string,
}