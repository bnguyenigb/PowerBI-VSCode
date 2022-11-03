import * as vscode from 'vscode';

import { Helper, UniqueId } from '../helpers/Helper';
import { ThisExtension } from '../ThisExtension';
import { iPowerBIGroup } from './GroupsAPI/_types';
import { ApiItemType } from '../vscode/treeviews/_types';
import { iPowerBIPipeline, iPowerBIPipelineStage } from './PipelinesAPI/_types';
import { ApiUrlPair } from './_types';
import { iPowerBIDatasetParameter } from './DatasetsAPI/_types';
import { iPowerBICapacity } from './CapacityAPI/_types';
import { iPowerBIGateway } from './GatewayAPI/_types';


import { fetch, getProxyAgent } from '@env/fetch';
import { RequestInit, Response, FormData } from '@env/fetch';

export abstract class PowerBIApiService {
	private static _isInitialized: boolean = false;
	private static _connectionTestRunning: boolean = false;
	private static _apiBaseUrl: string;
	private static _org: string = "myorg"
	private static _headers;

	//#region Initialization
	static async initialize(apiRootUrl: string = "https://api.powerbi.com/"): Promise<boolean> {
		try {
			ThisExtension.log("Initializing PowerBI API Service ...");

			this._apiBaseUrl = Helper.trimChar(apiRootUrl, '/');

			// https://github.com/microsoft/vscode-azure-account/blob/main/sample/src/extension.ts

			const { useIdentityPlugin, VisualStudioCodeCredential, DefaultAzureCredential  } = require("@azure/identity");

			// The plugin is the package's default export, so you may import and use it
			// as any name you like, and simply pass it to `useIdentityPlugin`.
			const { vsCodePlugin } = require("@azure/identity-vscode");

			useIdentityPlugin(vsCodePlugin);

			let credential = new DefaultAzureCredential();

			let accessToken = await credential.getToken("https://analysis.windows.net/powerbi/api/.default");

			this._headers = {
				"Authorization": 'Bearer ' + accessToken.token,
				"Content-Type": 'application/json',
				"Accept": 'application/json'
			}

			ThisExtension.log(`Testing new PowerBI API (${apiRootUrl}) settings ...`);
			this._connectionTestRunning = true;
			let workspaceList = await this.getGroups();
			this._connectionTestRunning = false;
			if (workspaceList.length > 0) {
				ThisExtension.log("Power BI API Service initialized!");
				this._isInitialized = true;
				return true;
			}
			else {
				ThisExtension.log(JSON.stringify(workspaceList));
				throw new Error(`Invalid Configuration for PowerBI REST API: Cannot access '${apiRootUrl}' with given credentials'!`);
			}
		} catch (error) {
			this._connectionTestRunning = false;
			ThisExtension.log("ERROR: " + error);
			vscode.window.showErrorMessage(error);
			return false;
		}
	}

	public static get Org(): string {
		return this._org;
	}

	public static get isInitialized(): boolean {
		return this._isInitialized;
	}
	//#endregion

	//#region Helpers
	private static async logResponse(response: any): Promise<void> {
		ThisExtension.log("Response: " + JSON.stringify(response));
	}

	private static async handleApiException(error: Error, showErrorMessage: boolean = false, raise: boolean = false): Promise<void> {
		ThisExtension.log("ERROR: " + error.name);
		ThisExtension.log("ERROR: " + error.message);
		if (error.stack) {
			ThisExtension.log("ERROR: " + error.stack);
		}

		if (showErrorMessage) {
			vscode.window.showErrorMessage(error.message);
		}

		if (raise) {
			throw error;
		}
	}

	private static getFullUrl(endpoint: string, params?: object): string {
		let uri = vscode.Uri.parse(`${this._apiBaseUrl}/${Helper.trimChar(endpoint, '/')}`);

		if (params) {
			let urlParams = []
			for (let kvp of Object.entries(params)) {
				urlParams.push(`${kvp[0]}=${kvp[1] as number | string | boolean}`)
			}
			uri = uri.with({ query: urlParams.join('&') })
		}

		return uri.toString(true);
	}

	static async get<T = any>(endpoint: string, params: object = null): Promise<T> {
		if (!this._isInitialized && !this._connectionTestRunning) {
			ThisExtension.log("API has not yet been initialized! Please connect first!");
		}
		else {
			ThisExtension.log("GET " + endpoint + " --> " + JSON.stringify(params));

			try {
				const config: RequestInit = {
					method: "GET",
					headers: this._headers,
					agent: getProxyAgent()
				};
				let response: Response = await fetch(this.getFullUrl(endpoint, params), config);

				let result = await response.json() as T;

				await this.logResponse(result);

				return result;
			} catch (error) {
				this.handleApiException(error);

				return undefined;
			}
		}
	}

	//static async post(endpoint: string, body: object, headers?: object): Promise<any> {
	static async post<T = any>(endpoint: string, body: object): Promise<T> {
		ThisExtension.log("POST " + endpoint + " --> " + JSON.stringify(body));

		try {
			const config: RequestInit = {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(body),
				agent: getProxyAgent()
			};
			let response: Response = await fetch(this.getFullUrl(endpoint), config);

			let result: T = await response.json() as T

			await this.logResponse(result);

			return result;
		} catch (error) {
			this.handleApiException(error);

			return undefined;
		}
	}


	static async postFile(endpoint: string, uri: vscode.Uri): Promise<any> {
		ThisExtension.log("POST " + endpoint + " --> (File)" + uri);

		try {
			let data: FormData = new FormData();
			data.append('file', uri.fsPath);

			let headers = this._headers;

			headers["Content-Type"] = "multipart/form-data";

			const config: RequestInit = {
				method: "POST",
				headers: headers,
				body: data,
				agent: getProxyAgent()
			};
			let response: Response = await fetch(this.getFullUrl(endpoint), config);

			let result = await response.json()

			await this.logResponse(result);

			return result;
		} catch (error) {
			this.handleApiException(error);

			return undefined;
		}
	}

	static async patch<T = any>(endpoint: string, body: object): Promise<T> {
		ThisExtension.log("PATCH " + endpoint + " --> " + JSON.stringify(body));

		try {
			const config: RequestInit = {
				method: "PATCH",
				headers: this._headers,
				body: JSON.stringify(body),
				agent: getProxyAgent()
			};
			let response: Response = await fetch(this.getFullUrl(endpoint), config);
			let result: T = await response.json() as T

			await this.logResponse(result);

			return result;
		} catch (error) {
			this.handleApiException(error);

			return undefined;
		}
	}

	static async delete<T = any>(endpoint: string, body: object): Promise<T> {
		ThisExtension.log("DELETE " + endpoint + " --> " + JSON.stringify(body));

		try {
			const config: RequestInit = {
				method: "DELETE",
				headers: this._headers,
				body: JSON.stringify(body),
				agent: getProxyAgent()
			};
			let response: Response = await fetch(this.getFullUrl(endpoint), config);
			let result: T = await response.json() as T

			await this.logResponse(result);

			return result;
		} catch (error) {
			this.handleApiException(error);

			return undefined;
		}
	}

	private static getUrl(groupId: string | UniqueId = undefined, itemType: ApiItemType = undefined): string {
		let group: string = "";
		if (groupId != null && groupId != undefined) {
			group = `/groups/${groupId.toString()}`;
		}

		let type = "";
		if (itemType != null && itemType != undefined) {
			type = `/${itemType.toString().toLowerCase()}`;
		}

		return `v1.0/${this.Org}${group}${type}`;
	}

	static getUrl2(apiItems: ApiUrlPair[]): string {
		let urlParts: string[] = [];

		for (let apiItem of apiItems) {
			if (apiItem.itemType == "GROUP" && !apiItem.itemId) {
				// skip GROUP item if no ID is specified -> use personal workspace
				continue;
			}
			urlParts.push(apiItem.itemType.toLowerCase());
			if (apiItem.itemId) {
				// can be empty, e.g. if we want to list all datasets of a workspace, we do not have a datasetId 
				urlParts.push(apiItem.itemId.toString())
			}
		}

		return `v1.0/${this.Org}/${urlParts.join("/")}`;
	}

	// legacy, should not be used anymore -> please use getItemList instead!
	static async getWorkspaceItemList<T>(groupId: string | UniqueId = undefined, itemType: ApiItemType = undefined, sortBy: string = "name"): Promise<T[]> {
		let endpoint = this.getUrl(groupId, itemType);

		let body = {};

		let response = await this.get(endpoint, { params: body });

		let result = response.data;
		let items = result.value as T[];

		if (items == undefined) {
			return [];
		}
		Helper.sortArrayByProperty(items, sortBy);
		return items;
	}

	static async getItemList<T>(endpoint: string, body: any = {}, sortBy: string = "name"): Promise<T[]> {
		let response = await this.get(endpoint, { params: body });

		let items = response.value as T[];

		if (items == undefined) {
			return [];
		}
		Helper.sortArrayByProperty(items, sortBy);
		return items;
	}

	static async getItemList2<T>(
		items: ApiUrlPair[],
		sortBy: string = "name"): Promise<T[]> {

		let endpoint = this.getUrl2(items);

		let body = {};

		let response = await this.get(endpoint, { params: body });

		let listItems = response.value as T[];

		if (items == undefined) {
			return [];
		}
		Helper.sortArrayByProperty(listItems, sortBy);
		return listItems;
	}
	//#endregion

	//#region Groups/Workspaces API
	static async getGroups(): Promise<iPowerBIGroup[]> {
		let items: iPowerBIGroup[] = await this.getItemList<iPowerBIGroup>(`v1.0/${PowerBIApiService.Org}/groups`);

		return items;
	}


	//#endregion

	//#region Datasets API
	static async getDatasetParameters(groupId: string | UniqueId, datasetId: string | UniqueId): Promise<iPowerBIDatasetParameter[]> {
		let items: iPowerBIDatasetParameter[] = await this.getItemList2<iPowerBIDatasetParameter>([
			{ itemType: "GROUPS", itemId: groupId },
			{ itemType: "DATASETS", itemId: datasetId },
			{ itemType: "PARAMETERS" }
		]);

		return items;
	}
	//#endregion

	//#region Reports API
	//#endregion

	//#region Dashboards API
	//#endregion

	//#region Dataflows API
	//#endregion


	//#region Capacities API
	static async getCapacities(): Promise<iPowerBICapacity[]> {

		let items: iPowerBICapacity[] = await this.getItemList<iPowerBICapacity>(`v1.0/${PowerBIApiService.Org}/capacities`, {}, "displayName");

		return items;
	}


	//#endregion


	//#region Gateways API
	static async getGateways(): Promise<iPowerBIGateway[]> {
		let items: iPowerBIGateway[] = await this.getItemList<iPowerBIGateway>(`v1.0/${PowerBIApiService.Org}/gateways`);

		return items;
	}


	//#endregion


	//#region Pipelines API
	static async getPipelines(): Promise<iPowerBIPipeline[]> {
		let items: iPowerBIPipeline[] = await this.getItemList<iPowerBIPipeline>(`v1.0/${PowerBIApiService.Org}/pipelines`);

		return items;
	}

	static async getPipelineStages(pipelineId: string | UniqueId): Promise<iPowerBIPipelineStage[]> {
		let items: iPowerBIPipelineStage[] = (await this.get(`v1.0/${this.Org}/pipelines/${pipelineId}/stages`)).data.value;

		return items;
	}
	//#endregion
}
