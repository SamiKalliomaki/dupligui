import { CronScheduleConfig } from "data/directoryConfig";
import React from "react";
import ReactRouter from "react-router";

import { Page } from './page';
import { FormErrorState, kClearFormErrorState, toFormErrorState } from "./utils";

type BackupScheduleProps = ReactRouter.RouteComponentProps<{
	name: string
}>;
export class BackupSchedule extends React.Component<BackupScheduleProps, FormErrorState & {
	backupSchedule: CronScheduleConfig,
	backupEnabled: boolean,
}> {
	constructor(props: BackupScheduleProps) {
		super(props);

		this.state = {
			...kClearFormErrorState,
			backupSchedule: CronScheduleConfig.kDefault,
			backupEnabled: false,
		}
	}

	componentDidMount() {
		this.reload();
	}

	handleCronChange(name: keyof CronScheduleConfig, event: React.ChangeEvent<HTMLInputElement>) {
		let newSchedule = { ...this.state.backupSchedule }
		newSchedule[name] = event.target.value;
		this.setState({
			backupSchedule: newSchedule
		})
	}

	handleBackupEnabledChange(event: React.ChangeEvent<HTMLSelectElement>) {
		this.setState({
			backupEnabled: event.target.value === 'true'
		})
	}

	async reload() {
		try {
			let config = await window.ipc.getDirectoryConfig(this.props.match.params.name);
			this.setState({
				backupSchedule: config.backupSchedule,
				backupEnabled: config.backupEnabled
			});
		} catch (e) {
			this.setState(toFormErrorState(e));
		}
	}

	async save() {
		try {
			await window.ipc.updateDirectoryConfig(this.props.match.params.name, {
				backupSchedule: this.state.backupSchedule,
				backupEnabled: this.state.backupEnabled,
				lastModified: new Date().toISOString(),
			})
			this.setState(kClearFormErrorState);
		} catch (e) {
			this.setState(toFormErrorState(e));
		}
	}

	render() {
		const cronField = ((name: keyof CronScheduleConfig, label: string) => {
			return <div className="field">
				<label htmlFor={"cron-" + name} className="label">{label}</label>
				<div className="control">
					<input
						id={"cron-" + name}
						className="input"
						type="text"
						value={this.state.backupSchedule[name]}
						onChange={this.handleCronChange.bind(this, name)} />
				</div>
				<p className="help is-danger">{this.state.fieldErrors[name]}</p>
			</div>;
		}).bind(this);

		return <Page name={"Backup schedule for directory: " + this.props.match.params.name}>
			{this.state.error &&
				<div className="notification is-warning is-hidden">{this.state.error}</div>
			}
			<div className="block content">
				<p>
					Cron-like configuration of backup schedule. Generally you want to use * down to some field
					and then specify the time you would like the backup to run.
				</p>
				<p>Examples:</p>
				<ul>
					<li>Any: *</li>
					<li>Range: 1-5</li>
					<li>Every X: */30</li>
					<li>Multiple: 2-5, 10</li>
				</ul>
			</div>
			<div className="block">
				{cronField("month", "Months (1-12)")}
				{cronField("dayOfMonth", "Day of month (1-31)")}
				{cronField("dayOfWeek", "Day of week (Sunday = 0 or 7, Monday = 1, Saturday = 6)")}
				{cronField("hour", "Hours")}
				{cronField("minute", "Minutes")}
				{cronField("second", "Seconds")}

				<div className="field">
					<label htmlFor="enabled" className="label">
						Enabled
					</label>
					<div className="control">
						<div className="select">
							<select
								id="enabled"
								value={this.state.backupEnabled ? "true" : "false"}
								onChange={this.handleBackupEnabledChange.bind(this)}>
								<option value="true">Yes</option>
								<option value="false">No</option>
							</select>
						</div>
						<p className="help is-danger">{this.state.fieldErrors['enabled']}</p>
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
			</div>
		</Page >
	}
}