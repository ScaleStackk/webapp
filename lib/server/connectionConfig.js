import fs from "node:fs";
import path from "node:path";

let cachedConfig;

function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required connection setting: ${fieldName}`);
  }
  return value.trim();
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readCredentials(awsConfig) {
  const accessKeyId = optionalString(awsConfig.accessKeyId);
  const secretAccessKey = optionalString(awsConfig.secretAccessKey);
  const sessionToken = optionalString(awsConfig.sessionToken);

  if (!accessKeyId && !secretAccessKey && !sessionToken) return undefined;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "aws.accessKeyId and aws.secretAccessKey must either both be set or both be empty",
    );
  }
  return { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
}

function readSasl(kafkaConfig) {
  if (!kafkaConfig.sasl?.enabled) return undefined;
  const mechanism = requireString(kafkaConfig.sasl.mechanism, "kafka.sasl.mechanism");
  if (!["plain", "scram-sha-256", "scram-sha-512"].includes(mechanism)) {
    throw new Error(`Unsupported Kafka SASL mechanism: ${mechanism}`);
  }
  return {
    mechanism,
    username: requireString(kafkaConfig.sasl.username, "kafka.sasl.username"),
    password: requireString(kafkaConfig.sasl.password, "kafka.sasl.password"),
  };
}

export function getConnectionConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = path.resolve(
    process.env.AWS_CONN_FILE || path.join(process.cwd(), "aws_conn.json"),
  );
  let rawConfig;
  try {
    rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read connection configuration at ${configPath}: ${error.message}`);
  }

  const awsConfig = rawConfig.aws || {};
  const s3Config = awsConfig.s3 || {};
  const kafkaConfig = rawConfig.kafka || {};
  const brokers = Array.isArray(kafkaConfig.brokers)
    ? kafkaConfig.brokers.map((broker) => String(broker).trim()).filter(Boolean)
    : [];
  if (!brokers.length) {
    throw new Error("kafka.brokers must contain at least one broker address");
  }

  const bucket = requireString(s3Config.bucket, "aws.s3.bucket");
  if (bucket === "REPLACE_WITH_PRIVATE_BUCKET_NAME") {
    throw new Error("Replace the placeholder aws.s3.bucket value in aws_conn.json");
  }

  cachedConfig = {
    aws: {
      region: requireString(awsConfig.region, "aws.region"),
      credentials: readCredentials(awsConfig),
      s3: {
        bucket,
        prefix: optionalString(s3Config.prefix) || "judgments",
        endpoint: optionalString(s3Config.endpoint),
        forcePathStyle: Boolean(s3Config.forcePathStyle),
        serverSideEncryption: optionalString(s3Config.serverSideEncryption),
        kmsKeyId: optionalString(s3Config.kmsKeyId),
      },
    },
    kafka: {
      clientId: optionalString(kafkaConfig.clientId) || "lexora-web-api",
      brokers,
      uploadTopic: requireString(kafkaConfig.uploadTopic, "kafka.uploadTopic"),
      ssl: Boolean(kafkaConfig.ssl),
      sasl: readSasl(kafkaConfig),
      connectionTimeout: Number(kafkaConfig.connectionTimeoutMs) || 10_000,
      requestTimeout: Number(kafkaConfig.requestTimeoutMs) || 30_000,
    },
    pipelineVersion: optionalString(rawConfig.pipeline?.version) || "1.0",
  };
  return cachedConfig;
}
