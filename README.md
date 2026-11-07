# QuestaCase legal research UI

A Next.js App Router application written in JavaScript and styled with Bootstrap.
Judgment upload is connected server-side to Amazon S3 and Kafka. Chat responses
remain simulated until the GraphRAG query API is implemented.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend connection indicator

The header checks the backend every 15 seconds. During local Next.js development it
uses `/api/health`. For a Firebase frontend connected to EC2, set the public API base
URL before building:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

The EC2 backend must expose `GET /health` and return JSON containing
`{"status":"ok"}`. This public variable contains only the API URL; never place AWS
credentials or other secrets in a `NEXT_PUBLIC_` variable.

## S3 and Kafka connection

Copy `aws_conn.example.json` to the git-ignored `aws_conn.json` and configure:

- AWS Region and private S3 bucket;
- optional local-development AWS credentials;
- Kafka broker addresses and `judgment.uploaded` topic;
- optional Kafka TLS/SASL authentication.

On EC2, attach an IAM instance role and leave the AWS key fields empty. The role
needs `s3:PutObject` permission for the configured judgment prefix. Never expose
`aws_conn.json` to the browser or commit it to Git.

The server accepts `POST /api/judgments` with a multipart field named
`judgment`. It validates the PDF, computes a SHA-256 document ID, uploads to:

```text
s3://BUCKET/judgments/DOCUMENT_ID/source.pdf
```

It then publishes a `judgment.uploaded` JSON event containing metadata and the S3
URI. The PDF itself is never placed on Kafka. A successful request returns HTTP
`202 Accepted` because KG and embedding processing happen asynchronously.

Set `AWS_CONN_FILE` to an absolute path if the connection file is mounted outside
the application directory:

```bash
AWS_CONN_FILE=/run/secrets/aws_conn.json npm start
```

For local development, credentials can also come from the standard AWS SDK
environment/profile chain; explicit keys in the JSON are optional.

## Remaining backend integration

The upload function in `lib/mockApi.js` now calls the live upload route. The
remaining `askJudgments()` function should later call the retrieval and answer
endpoint and return page-level sources.

The current upload route buffers files in application memory and caps them at
50 MB. This is suitable for the demonstration. A production version should use
presigned multipart S3 uploads for larger files or higher upload concurrency.
