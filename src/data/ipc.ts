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