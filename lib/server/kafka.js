import { Kafka, logLevel } from "kafkajs";
import { getConnectionConfig } from "./connectionConfig";

const producerState = globalThis.__lexoraKafkaProducerState || { promise: null };
globalThis.__lexoraKafkaProducerState = producerState;

async function getProducer() {
  if (producerState.promise) return producerState.promise;
  const { kafka: config } = getConnectionConfig();
  producerState.promise = (async () => {
    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      ...(config.sasl ? { sasl: config.sasl } : {}),
      connectionTimeout: config.connectionTimeout,
      requestTimeout: config.requestTimeout,
      logLevel: logLevel.INFO,
    });
    const producer = kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      maxInFlightRequests: 5,
    });
    await producer.connect();
    return producer;
  })().catch((error) => {
    producerState.promise = null;
    throw error;
  });
  return producerState.promise;
}

export async function publishJudgmentUploaded(event) {
  const { kafka } = getConnectionConfig();
  const producer = await getProducer();
  await producer.send({
    topic: kafka.uploadTopic,
    acks: -1,
    messages: [
      {
        key: event.document.documentId,
        value: JSON.stringify(event),
        headers: {
          "event-type": event.eventType,
          "schema-version": event.schemaVersion,
        },
      },
    ],
  });
}
