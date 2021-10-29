import { app } from "electron";
import { handleIpc } from "./util";

handleIpc('getAppConfig', async (event) => {
	return {
		openAtLogin: app.getLoginItemSettings().openAtLogin
	}
});

handleIpc('setAppConfig', async (event, newConfig) => {
	app.setLoginItemSettings({
		openAtLogin: newConfig.openAtLogin
	});
});