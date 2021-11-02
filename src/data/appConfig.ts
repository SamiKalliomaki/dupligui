import { DeepPartial } from "./util";

export interface AppConfig {
	openAtLogin: boolean
}

export module AppConfig {
	export const kDefault: AppConfig = {
		openAtLogin: false
	}

	export function sanitize(value: DeepPartial<AppConfig>): AppConfig {
		return {
			...kDefault,
			...value,
		}
	}
}