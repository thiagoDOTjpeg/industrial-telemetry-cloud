DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grafana_reader') THEN
        CREATE USER grafana_reader;
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lambda_api_user') THEN
        CREATE USER lambda_api_user;
    END IF;
END 
$$;

GRANT rds_iam TO lambda_api_user;
GRANT rds_iam TO grafana_reader;

CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    machine_id TEXT NOT NULL,
    temperature FLOAT NOT NULL,
    vibration_level FLOAT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT ON telemetry TO lambda_api_user;
GRANT INSERT ON telemetry TO lambda_api_user;
GRANT SELECT ON telemetry TO grafana_reader;
GRANT USAGE, SELECT ON SEQUENCE telemetry_id_seq TO lambda_api_user;