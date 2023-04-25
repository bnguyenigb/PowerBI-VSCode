import * as vscode from 'vscode';

import { ThisExtension } from '../../../ThisExtension';
import { PowerBIApiService } from '../../../powerbi/PowerBIApiService';

import { PowerBICapacityTreeItem } from './PowerBICapacityTreeItem';
import { PowerBICapacity } from './PowerBICapacity';
import { PowerBICapacitiesDragAndDropController } from './PowerBICapacitiesDragAndDropController';
import { iPowerBICapacity } from '../../../powerbi/CapacityAPI/_types';
import { PowerBICommandBuilder } from '../../../powerbi/CommandBuilder';

// https://vshaxe.github.io/vscode-extern/vscode/TreeDataProvider.html
export class PowerBICapacitiesTreeProvider implements vscode.TreeDataProvider<PowerBICapacityTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<PowerBICapacityTreeItem | undefined> = new vscode.EventEmitter<PowerBICapacityTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<PowerBICapacityTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(context: vscode.ExtensionContext) {
		const view = vscode.window.createTreeView('PowerBICapacities', { treeDataProvider: this, showCollapseAll: true, canSelectMany: true, dragAndDropController: new PowerBICapacitiesDragAndDropController() });
		context.subscriptions.push(view);

		ThisExtension.TreeViewCapacities = this;
	}
	
	async refresh(item: PowerBICapacityTreeItem = null, showInfoMessage: boolean = false): Promise<void> {
		if (showInfoMessage) {
			vscode.window.showInformationMessage('Refreshing Capacities ...');
		}
		this._onDidChangeTreeData.fire(null);
	}

	getTreeItem(element: PowerBICapacityTreeItem): PowerBICapacityTreeItem {
		return element;
	}

	getParent(element: PowerBICapacityTreeItem): vscode.ProviderResult<PowerBICapacityTreeItem> {
		return element;
	}

	async getChildren(element?: PowerBICapacityTreeItem): Promise<PowerBICapacityTreeItem[]> {
		if(!PowerBIApiService.isInitialized) { 			
			return Promise.resolve([]);
		}

		if (element != null && element != undefined) {
			return element.getChildren();
		}
		else {
			let children: PowerBICapacity[] = [];
			let items: iPowerBICapacity[] = await PowerBIApiService.getCapacities();

			for (let item of items) {
				let treeItem = new PowerBICapacity(item, undefined);
				children.push(treeItem);
				PowerBICommandBuilder.pushQuickPickItem(treeItem);
			}
			
			return children;
		}
	}

	// TopLevel Capacity functions
	add(): void {
		
	}
}