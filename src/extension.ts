'use strict';

import * as vscode from 'vscode';
import { PowerBICommandBuilder, PowerBICommandInput } from './powerbi/CommandBuilder';
import { ThisExtension } from './ThisExtension';
import { PowerBIDataset } from './vscode/treeviews/workspaces/PowerBIDataset';
import { PowerBIReport } from './vscode/treeviews/workspaces/PowerBIReport';

import { PowerBIWorkspacesTreeProvider } from './vscode/treeviews/workspaces/PowerBIWorkspacesTreeProvider';
import { PowerBIWorkspaceTreeItem } from './vscode/treeviews/workspaces/PowerBIWorkspaceTreeItem';

export async function activate(context: vscode.ExtensionContext) {

	let isValidated: boolean = await ThisExtension.initialize(context);
	if (!isValidated) {
		ThisExtension.log("Issue initializing extension - Please update PowerBI settings and restart VSCode!");
		vscode.window.showErrorMessage("Issue initializing extension - Please update PowerBI settings and restart VSCode!");
	}

	vscode.commands.registerCommand('PowerBI.updateQuickPickList', (treeItem: PowerBIWorkspaceTreeItem) => PowerBICommandBuilder.pushQuickPickItem(treeItem));

	// register PowerBIWorkspacesTreeProvider
	let pbiWorkspacesTreeProvider = new PowerBIWorkspacesTreeProvider();
	vscode.window.registerTreeDataProvider('PowerBIWorkspaces', pbiWorkspacesTreeProvider);
	vscode.commands.registerCommand('PowerBIWorkspaces.refresh', (showInfoMessage: boolean = true) => pbiWorkspacesTreeProvider.refresh(showInfoMessage));
	//vscode.commands.registerCommand('PowerBIWorkspaces.delete', () => pbiWorkspacesTreeProvider.add());

	// Dataset commands
	vscode.commands.registerCommand('PowerBIDataset.refresh', (dataset: PowerBIDataset) => dataset.refresh());
	vscode.commands.registerCommand('PowerBIDataset.takeOver', (dataset: PowerBIDataset) => dataset.takeOver());

	// Report commands
	vscode.commands.registerCommand('PowerBIReport.clone', (report: PowerBIReport) => report.clone());
	vscode.commands.registerCommand('PowerBIReport.rebind', (report: PowerBIReport) => report.rebind());
	vscode.commands.registerCommand('PowerBIReport.updateContent', (report: PowerBIReport) => report.updateContent());
}


export function deactivate() {
	ThisExtension.cleanUp();
}