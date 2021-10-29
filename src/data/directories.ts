import { DeepPartial } from "./util";

export interface DirectoryListEntry {
	name: string;
	path: string;
}

export module DirectoryListEntry {
	export const kDefault: DirectoryListEntry = {
		name: '',
		path: ''
	}
	export const kValidName = new RegExp('[a-zA-Z0-9_]+');

	export function equals(a: DirectoryListEntry, b: DirectoryListEntry) {
		return a.name == b.name && a.path == b.path;
	}

	export function sanitize(value: DeepPartial<DirectoryListEntry>): DirectoryListEntry {
		return { ...kDefault, ...value };
	}
}

export interface DirectoryListConfig {
	directories: ReadonlyArray<DirectoryListEntry>;
}

export module DirectoryListConfig {
	export const kDefault: DirectoryListConfig = {
		directories: []
	}

	export function sanitize(value: DeepPartial<DirectoryListConfig>): DirectoryListConfig {
		let config: DirectoryListConfig = { ...kDefault }
		if (value.directories !== undefined) {
			config.directories = value.directories.map(DirectoryListEntry.sanitize);
		}
		return config;
	}
}