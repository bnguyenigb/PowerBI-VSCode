export interface iDatabricksJobTask {
	task_key: string;
	depends_on: object[];
	spark_jar_task: object;
	notebook_task: {
		notebook_path: string,
		base_parameters: object,
		revision_timestamp: number
	};
	spark_python_task: object;
	spark_submit_task: object;
	job_cluster_key: string;
	timeout_seconds: number;
	email_notifications: object;
}



export interface iDatabricksJob {
	job_id: number;
	settings: {
		name: string;
		new_cluster: object;
		existing_cluster_id: string;
		libraries: object[];
		email_notifications: object;
		timeout_seconds: number;

		max_retries: number;
		min_retry_interval_millis: number;
		retry_on_timeout: boolean;

		schedule: {
			quartz_cron_expression: string,
			timezone_id: string,
			pause_status: string
		},

		max_concurrent_runs: number;

		tasks: iDatabricksJobTask[];
		format: string;
	};
	created_time: number;
}