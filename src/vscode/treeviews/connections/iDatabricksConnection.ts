import { CloudProvider, AccessTokenSecure, ConnectionSource } from './_types';
import { ExportFormatsConfiguration, LocalSyncSubfolderConfiguration } from '../../../ThisExtension';


export interface iDatabricksConnection {
	displayName: string;
	personalAccessToken: string;
	personalAccessTokenSecure?: AccessTokenSecure;
	apiRootUrl: string;
	localSyncFolder: string;
	localSyncSubfolders?: LocalSyncSubfolderConfiguration;
	exportFormats?: ExportFormatsConfiguration;
	useCodeCells?: boolean;

	_source: ConnectionSource;
}