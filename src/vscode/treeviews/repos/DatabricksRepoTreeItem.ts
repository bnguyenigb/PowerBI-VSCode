import * as vscode from 'vscode';
import * as fspath from 'path';
import { iDatabricksRepo, RepoProvider } from './_types';
import { Helper } from '../../../helpers/Helper';
import { ThisExtension } from '../../../ThisExtension';
import { DatabricksApiService } from '../../../databricksApi/databricksApiService';


// https://vshaxe.github.io/vscode-extern/vscode/TreeItem.html
export class DatabricksRepoTreeItem extends vscode.TreeItem {
	private _id: number;
	protected _definition: iDatabricksRepo;

	constructor(
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
	) {
		super(null, collapsibleState);
	}


	public async getChildren(): Promise<DatabricksRepoTreeItem[]> {
		return [];
	}

	async openBrowser(): Promise<void> {
		return null;
		//await Helper.openLink(this.link);
	}
}