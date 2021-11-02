import { updateAppConfig } from "../service/appConfig";
import { handleIpc } from "./util";

handleIpc('updateAppConfig', async (event, newConfig) => {
	updateAppConfig(newConfig);
});