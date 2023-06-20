import * as vscode from 'vscode';

/*
CLOUD_CONFIGS are mainly derived from here:
POST https://api.powerbi.com/powerbi/globalservice/v201606/environments/discover?client=powerbi-msolap
$x = Invoke-WebRequest -method POST -uri 'https://api.powerbi.com/powerbi/globalservice/v201606/environments/discover?client=powerbi-msolap'
Write-host $x
*/

interface iCloudConfig {
	authenticationEndpoint: string;
	authenticationProvider: string;
	apiEndpoint: string;
	resourceId: string;
	allowedDomains: string[];

}
const CLOUD_CONFIGS: { [key: string]: iCloudConfig } = {
	"GlobalCloud": {
		"authenticationProvider": "microsoft",
		"authenticationEndpoint": undefined,
		"apiEndpoint": "https://api.powerbi.com",
		"resourceId": "https://analysis.windows.net/powerbi/api",
		"allowedDomains": ["*.analysis.windows.net"]
	},
	"ChinaCloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.chinacloudapi.cn/common",
		"apiEndpoint": "https://api.powerbi.cn",
		"resourceId": "https://analysis.chinacloudapi.cn/powerbi/api",
		"allowedDomains": ["*.analysis.chinacloudapi.cn"]
	},
	"GermanyCloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.de/common",
		"apiEndpoint": "https://api.powerbi.de",
		"resourceId": "https://analysis.cloudapi.de/powerbi/api",
		"allowedDomains": ["*.analysis.cloudapi.de"]
	},
	"USGovCloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.com/common",
		"apiEndpoint": "https://api.powerbigov.us",
		"resourceId": "https://analysis.usgovcloudapi.net/powerbi/api",
		"allowedDomains": ["*.analysis.usgovcloudapi.net"]
	},
	"USGovDoDL4Cloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.us/common",
		"apiEndpoint": "https://api.high.powerbigov.us",
		"resourceId": "https://high.analysis.usgovcloudapi.net/powerbi/api",
		"allowedDomains": ["*.high.analysis.usgovcloudapi.net"]
	},
	"USGovDoDL5Cloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.us/common",
		"apiEndpoint": "https://api.mil.powerbigov.us",
		"resourceId": "https://mil.analysis.usgovcloudapi.net/powerbi/api",
		"allowedDomains": ["*.mil.analysis.usgovcloudapi.net"]
	},
	"USNatCloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.eaglex.ic.gov/common",
		"apiEndpoint": "https://api.powerbi.eaglex.ic.gov",
		"resourceId": "https://analysis.eaglex.ic.gov/powerbi/api/common",
		"allowedDomains": ["*.analysis.eaglex.ic.gov"]
	},
	"USSecCloud": {
		"authenticationProvider": "microsoft-sovereign-cloud",
		"authenticationEndpoint": "https://login.microsoftonline.eaglex.ic.gov/common",
		"apiEndpoint": "https://api.powerbi.microsoft.scloud",
		"resourceId": "https://analysis.microsoft.scloud/powerbi/api",
		"allowedDomains": ["*.analysis.microsoft.scloud"]
	}
}


export abstract class PowerBIConfiugration {
	static get cloud(): string { return this.getValue("cloud"); }
	static set cloud(value: string) { this.setValue("cloud", value); }

	static get tenantId(): string { return this.getValue("tenantId"); }
	static set tenantId(value: string) { this.setValue("tenantId", value); }

	static get clientId(): string { return this.getValue("clientId"); }
	static set clientId(value: string) { this.setValue("clientId", value); }

	static get apiUrl(): string { return CLOUD_CONFIGS[this.cloud].apiEndpoint; }

	static get authenticationProvider(): string { return CLOUD_CONFIGS[this.cloud].authenticationProvider; }

	static get authenticationEndpoint(): string { return CLOUD_CONFIGS[this.cloud].authenticationEndpoint; }

	static get resourceId(): string { return CLOUD_CONFIGS[this.cloud].resourceId; }

	static get isSovereignCloud(): boolean {
		return this.authenticationProvider === "microsoft-sovereign-cloud";
	}

	static get config(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration("powerbi");
	}

	static getValue(key: string): any {
		return this.config.get(key);
	}

	static setValue(key: string, value: any, target: boolean | vscode.ConfigurationTarget = null): void {
		this.config.update(key, value, target);
	}

	static unsetValue(key: string, target: boolean | vscode.ConfigurationTarget = null): void {
		this.setValue(key, undefined, target);
	}

	static applySettings(): void {
		if(this.isSovereignCloud)
		{
			vscode.workspace.getConfiguration().update("microsoft-sovereign-cloud.endpoint", this.authenticationEndpoint)
		}
	}
}