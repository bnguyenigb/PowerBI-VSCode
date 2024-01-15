import * as vscode from 'vscode';

import { PowerBIWorkspaceTreeItem } from './PowerBIWorkspaceTreeItem';
import { Helper, UniqueId } from '../../../helpers/Helper';
import { ThisExtension } from '../../../ThisExtension';
import { PowerBIApiService } from '../../../powerbi/PowerBIApiService';
import { PROCESSING_TYPES, PowerBIDataset } from './PowerBIDataset';
import { iPowerBIDatasetDMV, iPowerBIDatasetRefreshableObject } from '../../../powerbi/DatasetsAPI/_types';
import { PowerBIDatasetTables } from './PowerBIDatasetTables';
import { PowerBIDatasetTableColumns } from './PowerBIDatasetTableColumns';
import { PowerBIDatasetTableMeasures } from './PowerBIDatasetTableMeasures';
import { PowerBIDatasetTable } from './PowerBIDatasetTable';

// https://vshaxe.github.io/vscode-extern/vscode/TreeItem.html
export class PowerBIDatasetTablePartition extends PowerBIWorkspaceTreeItem {

	constructor(
		definition: iPowerBIDatasetDMV,
		group: UniqueId,
		parent: PowerBIDatasetTableColumns
	) {
		super(definition.name, group, "DATASETTABLEPARTITION", definition.id, parent, vscode.TreeItemCollapsibleState.None);

		this.definition = definition;

		this.id = this.parent.uid + "/" + definition.id;
		this.description = this._description;
		this.tooltip = this._tooltip;
		this.contextValue = this._contextValue;
		this.iconPath = this.getIcon();
	}


	// description is show next to the label
	get _description(): string {
		return this.definition.id;
	}

	getIcon(): vscode.ThemeIcon {
		return new vscode.ThemeIcon("extensions");
	}

	/* Overwritten properties from PowerBIApiTreeItem */
	get _contextValue(): string {
		let orig: string = super._contextValue;

		let actions: string[] = [];

		if (this.dataset.workspace.isPremiumCapacity) {
			actions.push("REFRESH");
		}

		return orig + actions.join(",") + ",";
	}

	get definition(): iPowerBIDatasetDMV {
		return super.definition as iPowerBIDatasetDMV;
	}

	private set definition(value: iPowerBIDatasetDMV) {
		super.definition = value;
	}

	get table(): PowerBIDatasetTable {
		return this.parent.parent as PowerBIDatasetTable;
	}

	get dataset(): PowerBIDataset {
		return (this.table as PowerBIDatasetTable).dataset;
	}

	// DatasetTablePartition-specific funtions
	public async refresh(): Promise<void> {
		const isOnDedicatedCapacity = this.dataset.workspace.isPremiumCapacity;
		const objectToRefresh: iPowerBIDatasetRefreshableObject = { table: this.table.name, partition: this.name };
		await PowerBIDataset.refreshById(this.groupId.toString(), this.dataset.id, isOnDedicatedCapacity,[objectToRefresh]);

		await Helper.delay(1000);
		ThisExtension.TreeViewWorkspaces.refresh(this.dataset, false);
	}
}