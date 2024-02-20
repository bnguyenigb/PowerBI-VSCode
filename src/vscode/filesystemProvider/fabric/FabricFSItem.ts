import * as vscode from 'vscode';

import { ThisExtension } from '../../../ThisExtension';
import { Helper } from '../../../helpers/Helper';
import { FabricFSItemPartFile } from './FabricFSItemPartFile';
import { LoadingState } from './_types';
import { FabricFSUri } from './FabricFSUri';
import { FabricFSCacheItem } from './FabricFSCacheItem';
import { FabricApiItemFormat, FabricApiItemType, iFabricApiItem, iFabricApiItemPart } from '../../../fabric/_types';
import { FabricFSWorkspace } from './FabricFSWorkspace';
import { FabricApiService } from '../../../fabric/FabricApiService';
import { FabricFSItemPartFolder } from './FabricFSItemPartFolder';

export class FabricFSItem extends FabricFSCacheItem implements iFabricApiItem {
	id: string;
	displayName: string;
	description: string;
	type: FabricApiItemType;
	workspace: FabricFSWorkspace;
	parts: FabricFSItemPartFile[];
	format?: FabricApiItemFormat;

	loadingState: LoadingState;
	partsLoadingState: LoadingState;

	constructor(uri: FabricFSUri) {
		super(uri);
	}

	get workspaceId(): string {
		return this.workspace.id;
	}

	public async loadStatsFromApi<T>(): Promise<void> {
		this._stats = {
			type: vscode.FileType.Directory,
			ctime: undefined,
			mtime: undefined,
			size: undefined
		};
	}

	public async loadChildrenFromApi<T>(): Promise<void> {
		if (!this._children) {
			const apiItems = await FabricApiService.getItemParts(this.FabricUri.workspaceId, this.FabricUri.itemId);
			this._children = [];
			this.parts = [];

			let folders: [string, vscode.FileType][] = [];
			let files: [string, vscode.FileType][] = [];

			for (let item of apiItems) {
				this.parts.push(new FabricFSItemPartFile(this.FabricUri, item));

				const partParts = item.path.split("/");
				if (partParts.length == 1) {
					files.push([item.path, vscode.FileType.File]);
					
				}
				else {
					const folderName = partParts[0];
					if (!folders.find((folder) => folder[0] == folderName)) {
						folders.push([folderName, vscode.FileType.Directory]);
					}
				}
			}
			this._children = folders.concat(files);
		}
	}
}