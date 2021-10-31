import { StringResult } from "cron-parser";
import { DeepPartial } from "./util";

export interface CronScheduleConfig {
	second: string;
	minute: string;
	hour: string;
	dayOfMonth: string;
	month: string;
	dayOfWeek: string;
}

export module CronScheduleConfig {
	export const kDefault = {
		second: '0',
		minute: '0',
		hour: '0',
		dayOfMonth: '*',
		month: '*',
		dayOfWeek: '*',
	}

	export function sanitize(value: DeepPartial<CronScheduleConfig>): CronScheduleConfig {
		return { ...kDefault, ...value };
	}
}

export interface DirectoryConfig {
	backupSchedule: CronScheduleConfig;
	backupEnabled: boolean;
	lastBackup: string | null;
	lastModified: string | null;
	backupState: 'idle' | 'pending' | 'executing' | 'done' | 'error';
	lastBackupResult: string;
}

export module DirectoryConfig {
	export const kDefault: DirectoryConfig = {
		backupSchedule: CronScheduleConfig.kDefault,
		backupEnabled: false,
		lastBackup: null,
		lastModified: null,
		backupState: 'idle',
		lastBackupResult: '',
	}

	export function sanitize(value: DeepPartial<DirectoryConfig>): DirectoryConfig {
		let config: DirectoryConfig = {
			...kDefault,
			...value,
			backupSchedule: kDefault.backupSchedule
		}
		if (value.backupSchedule !== undefined) {
			config.backupSchedule = CronScheduleConfig.sanitize(value.backupSchedule)
		}
		return config;
	}
}