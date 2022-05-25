import * as vscode from 'vscode';
import * as fspath from 'path';

import { ThisExtension } from '../../../ThisExtension';
import { Helper } from '../../../helpers/Helper';
import { DatabricksApiService } from '../../../databricksApi/databricksApiService';
import { SecretBackendType, SecretTreeItemType } from './_types';

// https://vshaxe.github.io/vscode-extern/vscode/TreeItem.html
export class DatabricksSecretTreeItem extends vscode.TreeItem {
	private _path: string; // path like /secret-scope/secret-name
	private _scope: string;
	private _scope_backend_type: SecretBackendType | undefined;
	private _secret: string;
	private _itemType: SecretTreeItemType;

	constructor(
		scope: string = undefined,
		scope_backend_type: SecretBackendType = undefined,
		secret: string = undefined,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
	) {
		super('/', collapsibleState);
		this._path = "/" + (scope == undefined ? "" : scope ) + (secret == undefined ? "" : "/" + secret );
		this._itemType = (scope == undefined ? "ROOT" : (secret == undefined ? "SCOPE" : "SECRET" ));
		this._scope = scope;
		this._scope_backend_type = scope_backend_type;
		this._secret = secret;

		super.label = this.path.split('/').pop();
		super.contextValue = this._contextValue;
		super.description = this._description;
		super.iconPath = {
			light: this.getIconPath("light"),
			dark: this.getIconPath("dark")
		};
		super.command = this.getCommand();

		// secrets should not be expandable anymore
		if(this.itemType == 'SECRET')
		{
			super.collapsibleState = undefined;
		}
	}

	// used in package.json to filter commands via viewItem == CANSTART
	get _contextValue(): string {
		return this.itemType + "_" + this.scope_backend_type;
	}

	private get _description(): string {
		if(this.scope_backend_type == "AZURE_KEYVAULT")
		{
			return "READ-ONLY";
		}
		return "";
	}

	private getIconPath(theme: string): string {
		let image = (this.itemType == 'SECRET' ? 'secret' : fspath.join('workspace', 'directory'));
		return fspath.join(ThisExtension.rootPath, 'resources', theme, image + '.png');
	}

	private getCommand(): vscode.Command {
		/*
		return { 
			command: 'databricksSecretItem.open', title: "Open File", arguments: [this]
		};
		*/
		return undefined;
	}


	get path (): string {
		return this._path;
	}	

	get itemType(): SecretTreeItemType {
		return this._itemType;
	}

	get scope (): string {
		return this._scope;
	}

	get scope_backend_type (): SecretBackendType {
		return this._scope_backend_type;
	}

	get secret (): string {
		return this._secret;
	}

	

	getChildren(): Thenable<DatabricksSecretTreeItem[]> {
		if(this.itemType === 'ROOT')
		{
			return DatabricksApiService.listSecretScopes();
		}
		else if(this.itemType === 'SCOPE')
		{
			return DatabricksApiService.listSecrets(this.scope, this.scope_backend_type);
		}
		return null;
	}

	async addSecretScope(): Promise<void> {
		let scopeName = await Helper.showInputBox("<name of scope>", "The name of the secret scope to create");
		let managingPrincipal = await Helper.showQuickPick(["users"], "Which group/user is allowed to manage the secret scope");

		await DatabricksApiService.createSecretScopes(scopeName, managingPrincipal);

		setTimeout(() => vscode.commands.executeCommand("databricksSecrets.refresh", false), 1000);
	}

	async deleteSecretScope(): Promise<void> {
		if(this.itemType == 'SCOPE')
		{
			await DatabricksApiService.deleteSecretScope(this.scope);

			setTimeout(() => vscode.commands.executeCommand("databricksSecrets.refresh", false), 1000);
		}
		else
		{
			vscode.window.showErrorMessage("Invalid operation! deleteSecretScope() can only be called on itemType 'SCOPE'!");
		}
	}

	async addSecret(): Promise<void> {
		let secretName = await Helper.showInputBox("<name of secret>", "The name of the secret to create");
		let value = await Helper.showInputBox("<value for '" + secretName + "'>", "The value for the secret '" + secretName + "'");

		await DatabricksApiService.setSecret(this.scope, secretName, value);

		setTimeout(() => vscode.commands.executeCommand("databricksSecrets.refresh", false), 1000);
	}

	async updateSecret(): Promise<void> {
		let newValue = await Helper.showInputBox("<new value for the '" + this.secret + "'>", "The new value for the secret '" + this.secret + "'");

		await DatabricksApiService.setSecret(this.scope, this.secret, newValue);

		setTimeout(() => vscode.commands.executeCommand("databricksSecrets.refresh", false), 1000);
	}

	async deleteSecret(): Promise<void> {
		if(this.itemType == 'SECRET')
		{
			await DatabricksApiService.deleteSecret(this.scope, this.secret);

			setTimeout(() => vscode.commands.executeCommand("databricksSecrets.refresh", false), 1000);
		}
		else
		{
			vscode.window.showErrorMessage("Invalid operation! deleteSecret() can only be called on itemType 'SECRET'!");
		}
	}
}