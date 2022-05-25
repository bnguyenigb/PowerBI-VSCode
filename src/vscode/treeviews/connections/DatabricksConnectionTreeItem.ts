import * as vscode from 'vscode';
import * as fspath from 'path';
import { ThisExtension, ExportFormatsConfiguration, LocalSyncSubfolderConfiguration } from '../../../ThisExtension';
import { CloudProvider, AccessTokenSecure, ConnectionSource, SensitiveValueStore } from './_types';
import { iDatabricksConnection } from './iDatabricksConnection';
import { Helper } from '../../../helpers/Helper';
import { DatabricksApiService } from '../../../databricksApi/databricksApiService';


// https://vshaxe.github.io/vscode-extern/vscode/TreeItem.html
export class DatabricksConnectionTreeItem extends vscode.TreeItem implements iDatabricksConnection {
	_displayName: string;
	_personalAccessToken: string;
	_apiRootUrl: string;
	_localSyncFolder: string;
	_localSyncSubfolders: LocalSyncSubfolderConfiguration;
	_isActive: boolean;
	_exportFormats: ExportFormatsConfiguration;
	_useCodeCells: boolean;
	_personalAccessTokenSecure: {
		keyTarSettingName: string,
		databricksCLIProfileName: string
	};

	_source: ConnectionSource;
	_secureTokenName: string = this.displayName + "-API-Token";
	_secureTokenStore: SensitiveValueStore;

	constructor(
		definition: iDatabricksConnection
	) {
		super(definition.displayName);
		this._displayName = definition.displayName;
		this._personalAccessToken = definition.personalAccessToken;
		this._personalAccessTokenSecure = definition.personalAccessTokenSecure;
		this._apiRootUrl = Helper.trimChar(definition.apiRootUrl, '/', false, true);
		this._localSyncFolder = Helper.resolvePath(definition.localSyncFolder);
		this._localSyncSubfolders = definition.localSyncSubfolders;
		this._exportFormats = definition.exportFormats;
		this._useCodeCells = definition.useCodeCells;
		this._source = definition._source;

		this._isActive = this.displayName === ThisExtension.ActiveConnectionName;

		super.tooltip = this._tooltip;
		super.description = this._description;
		super.contextValue = this._contextValue;
		super.iconPath = {
			light: this.getIconPath("light"),
			dark: this.getIconPath("dark")
		};
		// Connections are never expandable
		super.collapsibleState = undefined;

		this._isActive = false;

		this.manageSecureToken();
	}

	//tooltip = this._tooltip;
	private get _tooltip(): string {
		return  `Host: ${this.apiRootUrl}\n` + 
				`CloudProvider: ${this.cloudProvider}\n` + 
				`LocalSyncFolder: ${this.localSyncFolder}\n` + 
				`LocalSyncSubFolders: ${JSON.stringify(this.localSyncSubfolders)}\n` + 
				`ExportFormats: ${JSON.stringify(this.exportFormats)}\n` + 
				`UseCodeCells: ${this.useCodeCells}\n` + 
				`Source: ${this.source}`;
	}

	// description is show next to the label
	//description = this._description;
	private get _description(): string {
		//return "";
		return `${fspath.join(Helper.trimChar(Helper.trimChar(this.localSyncFolder, '/', false, true), '\\', false, true), " ")}`;
	}

	// used in package.json to filter commands via viewItem == ACTIVE
	//contextValue = this._contextValue;
	private get _contextValue(): string {
		if (this.displayName == ThisExtension.ActiveConnectionName) {
			return 'ACTIVE';
		}
		return 'INACTIVE';
	}

	private getIconPath(theme: string): string {
		let state = this.isActive ? 'connected' : 'disconnected';
		return fspath.join(ThisExtension.rootPath, 'resources', theme, state + '.png');
	}


	get displayName(): string {
		if (!this._displayName) { return this.label.toString(); }
		return this._displayName;
	}

	get cloudProvider(): CloudProvider {
		if (this.apiRootUrl.toLowerCase().includes('azuredatabricks')) {
			return "Azure";
		}
		if (this.apiRootUrl.toLowerCase().includes('.gcp.')) {
			return "GCP";
		}
		else {
			return "AWS";
		}
	}

	get apiRootUrl(): string {
		return this._apiRootUrl;
	}

	get personalAccessToken(): string {
		return this._personalAccessToken;
	}

	get localSyncFolder(): string {
		return this._localSyncFolder;
	}

	get localSyncSubfolders(): LocalSyncSubfolderConfiguration {
		return this._localSyncSubfolders;
	}

	set localSyncSubfolders(value: LocalSyncSubfolderConfiguration) {
		this._localSyncSubfolders = value;
	}

	get exportFormats(): ExportFormatsConfiguration {
		return this._exportFormats;

	}

	set exportFormats(value: ExportFormatsConfiguration) {
		this._exportFormats = value;
	}

	get useCodeCells(): boolean {
		return this._useCodeCells;
	}

	set useCodeCells(value: boolean) {
		this._useCodeCells = value;
	}

	get personalAccessTokenSecure(): AccessTokenSecure {
		return this._personalAccessTokenSecure;
	}

	get source(): ConnectionSource {
		return this._source;
	}

	set source(value: ConnectionSource) {
		this._source = value;
	}


	get isActive(): boolean {
		return this._isActive;
	}

	static fromJson(jsonString: string, source: ConnectionSource): DatabricksConnectionTreeItem {
		let item: iDatabricksConnection = JSON.parse(jsonString);
		item._source = source;
		return new DatabricksConnectionTreeItem(item);
	}

	private async manageSecureToken(): Promise<void> {
		this._secureTokenStore = ThisExtension.SensitiveValueStore;

		if (this.personalAccessTokenSecure) {
			if (this.personalAccessTokenSecure.keyTarSettingName) {
				this._secureTokenStore = "SystemKeyChain";
				this._secureTokenName = this.personalAccessTokenSecure.keyTarSettingName;
			}
			else if (this.personalAccessTokenSecure.databricksCLIProfileName) {
				this._secureTokenStore = "ExternalConfigFile";
				this._secureTokenName = this.personalAccessTokenSecure.databricksCLIProfileName;
			}
		}

		// if a new PAT was supplied, we use this one and overwrite/update the existing value
		if (this.personalAccessToken) {
			switch (this._secureTokenStore) {
				case "SystemKeyChain":
					ThisExtension.log("Storing Personal Access Token in System KeyChain '" + this._secureTokenName + "' ...");
					ThisExtension.setSecureSetting(this._secureTokenName, this.personalAccessToken);
					this.updateConnectionConfig(this._secureTokenName, undefined);
					break;

				case "ExternalConfigFile":
					ThisExtension.log("Storing Personal Access Token in External Config File");
					throw "Not yet implemented!";

				case "VSCodeSettings":
					throw "Not yet implemented!";
					break;

				default:
					throw "Invalid Sensitive Value Store !";
					break;
			}
		}
	}

	public async getAccessToken(): Promise<string> {
		if (!this.personalAccessToken) {
			switch (this._secureTokenStore) {
				case "SystemKeyChain":
					ThisExtension.log("Getting Personal Access Token from System KeyChain '" + this._secureTokenName + "'");
					this._personalAccessToken = await ThisExtension.getSecureSetting(this._secureTokenName);

					if (!this._personalAccessToken) {
						let msg = "Databricks Personal Access Token not found in System Key Chain!";
						ThisExtension.log(msg);
						ThisExtension.log("Please add the Personal access token again using the configuration property 'personalAccessToken' and refersh the connections.");
						vscode.window.showErrorMessage(msg);
					}

					break;

				case "ExternalConfigFile":
					ThisExtension.log("Getting Personal Access Token from External Config File");
					throw "Not yet implemented!";

					break;

				case "VSCodeSettings":
					throw "Not yet implemented!";

					break;

				default:
					throw "Invalid Sensitive Value Store !";

					break;
			}
		}

		if (!this.personalAccessToken) {
			ThisExtension.log("ERROR: Could not load PersonalAccessToken '" + this._secureTokenName + "' from '" + this._secureTokenStore + "'!");
			vscode.window.showErrorMessage("Could not load PersonalAccessToken '" + this._secureTokenName + "' from '" + this._secureTokenStore + "'!");
		}

		return this.personalAccessToken;
	}

	private updateConnectionConfig(secureTokenName: string | undefined, cliProfileName: string | undefined): void {
		this._personalAccessTokenSecure = { "keyTarSettingName": secureTokenName, "databricksCLIProfileName": cliProfileName };

		ThisExtension.ConnectionManager.updateConnection(this);
	}

	private static propertyIsValid(value): boolean {
		if (value != undefined && value != null && value != "") {
			return true;
		}
		return false;
	}

	static validate(con: iDatabricksConnection, showMessage: boolean = true): boolean {
		let msg: string = null;

		// check mandatory properties and raise an error if necessary
		if (!this.propertyIsValid(con.displayName)) {
			if (showMessage) {
				msg = 'Configuration property "displayName" is not valid! Please check your user and/or workspace settings!';
				ThisExtension.log(msg);
				vscode.window.showErrorMessage(msg);
			}
			return false;

		}
		if (!this.propertyIsValid(con.apiRootUrl)) {
			if (showMessage) {
				msg = 'Configuration ' + con.displayName + ': Property "apiRootUrl" is not valid! Please check your user and/or workspace settings!';
				ThisExtension.log(msg);
				vscode.window.showErrorMessage(msg);
			}
			return false;
		}
		if (!this.propertyIsValid(con.personalAccessToken) && !this.propertyIsValid(con.personalAccessTokenSecure)) {
			if (showMessage) {
				msg = 'Configuration ' + con.displayName + ': Property "personalAccessToken" or "personalAccessTokenSecure" is not valid! Please check your user and/or workspace settings!';
				ThisExtension.log(msg);
				vscode.window.showErrorMessage(msg);
			}
			return false;
		}
		if (!this.propertyIsValid(con.localSyncFolder)) {
			if (showMessage) {
				msg = 'Configuration ' + con.displayName + ': Property "localSyncFolder" is not valid! Please check your user and/or workspace settings!';
				ThisExtension.log(msg);
				vscode.window.showErrorMessage(msg);
			}
			return false;
		}

		// check defaultvalues, etc.
		if (!this.propertyIsValid(con.localSyncSubfolders)) {
			let defaultFromExtension = ThisExtension.configuration.packageJSON.contributes.configuration[0].properties["databricks.connection.default.localSyncSubfolders"].default;
			con.localSyncSubfolders = defaultFromExtension;
			msg = 'Configuration ' + con.displayName + ': Property "localSyncSubfolders" was not provided - using the default value!';
			ThisExtension.log(msg);
			//vscode.window.showWarningMessage(msg);
		}
		// check defaultvalues, etc.
		if (!this.propertyIsValid(con.exportFormats)) {
			let defaultFromExtension = ThisExtension.configuration.packageJSON.contributes.configuration[0].properties["databricks.connection.default.exportFormats"].default;
			con.exportFormats = defaultFromExtension;
			msg = 'Configuration ' + con.displayName + ': Property "exportFormats" was not provided - using the default value!';
			ThisExtension.log(msg);
			//vscode.window.showWarningMessage(msg);
		}
		if (con.useCodeCells == undefined) { // this.propertyIsValid does not work for booleans !!!
			// get the default from the config of this extension
			let defaultFromExtension = ThisExtension.configuration.packageJSON.contributes.configuration[0].properties["databricks.connection.default.useCodeCells"].default;
			con.useCodeCells = defaultFromExtension;
			msg = 'Configuration ' + con.displayName + ': Property "useCodeCells" was not provided - using the default value "' + defaultFromExtension + '"!';
			ThisExtension.log(msg);
			//vscode.window.showWarningMessage(msg);
		}

		return true;
	}

	async activate(): Promise<void> {
		ThisExtension.log(`Activating Databricks Connection '${this.displayName}' ...`);

		ThisExtension.ActiveConnection = this;
		await ThisExtension.updateConfigurationSetting("databricks.lastActiveConnection", this.displayName);

		if (await DatabricksApiService.initialize(this)) {
			if (this.useCodeCells) {
				await ThisExtension.updateConfigurationSetting("python.dataScience.codeRegularExpression", "^(# COMMAND ----------|#\\s*%%|#\\s*\\<codecell\\>|#\\s*In\\[\\d*?\\]|#\\s*In\\[ \\])");
			}
			else {
				await ThisExtension.updateConfigurationSetting("python.dataScience.codeRegularExpression", undefined);
			}

			this._isActive = true;
			ThisExtension.SQLClusterID = undefined;

			Helper.delay(100);

			vscode.commands.executeCommand("databricksWorkspace.refresh", false);
			vscode.commands.executeCommand("databricksClusters.refresh", false);
			vscode.commands.executeCommand("databricksJobs.refresh", false);
			vscode.commands.executeCommand("databricksFS.refresh", false);
			vscode.commands.executeCommand("databricksSecrets.refresh", false);
			vscode.commands.executeCommand("databricksSQL.refresh", false);
			vscode.commands.executeCommand("databricksRepos.refresh", false);

			vscode.commands.executeCommand("databricksConnections.refresh", false);
		}
	}

	get WorkspaceSubFolder(): string {
		try {
			return this._localSyncSubfolders.Workspace;
		} catch (error) {
			return "Workspace";
		}
	}

	get ClustersSubFolder(): string {
		try {
			return this._localSyncSubfolders.Clusters;
		} catch (error) {
			return "Clusters";
		}
	}

	get DatabricksFSSubFolder(): string {
		try {
			return this._localSyncSubfolders.DBFS;
		} catch (error) {
			return "DBFS";
		}
	}

	get JobsSubFolder(): string {
		try {
			return this._localSyncSubfolders.Jobs;
		} catch (error) {
			return "Jobs";
		}
	}
}
