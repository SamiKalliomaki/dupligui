import React from "react";
import ReactRouter from "react-router";

import { AppConfig } from "data/appConfig";
import { Page } from './page';
import { FormErrorState, kClearFormErrorState, toFormErrorState } from "./utils";

type AppConfigPageProps = ReactRouter.RouteComponentProps;
export class AppConfigPage extends React.Component<AppConfigPageProps, FormErrorState & {
	config: AppConfig
}> {
	constructor(props: AppConfigPageProps) {
		super(props);

		this.state = {
			...kClearFormErrorState,
			config: {
				openAtLogin: false
			}
		}
	}

	componentDidMount() {
		this.reload()
	}

	async reload() {
		let config = await window.getValue('appConfig');
		this.setState({
			config: config
		});
	}

	async save() {
		try {
			await window.ipc.updateAppConfig(this.state.config);
			this.setState(kClearFormErrorState);
		} catch (e) {
			this.setState(toFormErrorState(e));
		}
	}

	handleOpenAtLoginChange(event: React.ChangeEvent<HTMLSelectElement>) {
		this.setState({
			config: {
				...this.state.config,
				openAtLogin: event.target.value === 'true'
			}
		});
	}

	render() {
		return <Page name="App configuration">
			<div className="field">
				<label htmlFor="openAtLogin" className="label">
					Open at login
				</label>
				{this.state.error &&
					<div className="notification is-warning is-hidden">{this.state.error}</div>
				}
				<div className="control">
					<div className="select">
						<select
							id="openAtLogin"
							value={this.state.config.openAtLogin ? "true" : "false"}
							onChange={this.handleOpenAtLoginChange.bind(this)}>
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>
					</div>
					<p className="help is-danger">{this.state.fieldErrors['openAtLogin']}</p>
				</div>
			</div>
			<div className="field is-grouped">
				<div className="control">
					<button className="button is-primary" onClick={this.save.bind(this)}>Save</button>
				</div>
				<div className="control">
					<button className="button" onClick={this.reload.bind(this)}>Reload</button>
				</div>
			</div>
		</Page >
	}
}