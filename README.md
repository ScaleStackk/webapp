# QuestaCase legal research UI

Static Next.js App Router frontend for Firebase Hosting. The browser communicates
with the EC2 API over HTTPS and uploads judgment PDFs directly to S3 using
short-lived presigned URLs. AWS credentials, Kafka credentials, and database
credentials must never be placed in this repository or in `NEXT_PUBLIC_`
variables.

## Local development

Requires Node.js 20.9 or newer. Create a local environment file:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_BACKEND_URL` to the EC2 API base URL, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Browser-to-backend API contract

If the configured base URL is `https://api.example.com/api/v1`, the frontend uses
these endpoints:

### `GET /health`

Returns backend availability:

```json
{"status":"ok"}
```

### `POST /uploads/presign`

Request:

```json
{
  "filename": "judgment.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 123456
}
```

Response:

```json
{
  "documentId": "server-generated-id",
  "uploadUrl": "https://bucket.s3.region.amazonaws.com/...signed-query...",
  "uploadHeaders": {"Content-Type":"application/pdf"},
  "storage": {"bucket":"private-bucket","key":"judgments/id/source.pdf"}
}
```

The browser performs an HTTP `PUT` directly to `uploadUrl`. The EC2 service must
create a short-lived URL restricted to that object key, content type, and intended
maximum size. Do not return AWS credentials.

### `POST /judgments`

Called after S3 accepts the PDF. EC2 should verify that the object exists, validate
its size/type, publish the `judgment.uploaded` Kafka event, and return `202`:

```json
{
  "documentId": "server-generated-id",
  "filename": "judgment.pdf",
  "sizeBytes": 123456,
  "etag": "s3-etag",
  "storage": {"bucket":"private-bucket","key":"judgments/id/source.pdf"}
}
```

### `POST /query`

Request:

```json
{"question":"What was the holding?","judgmentIds":["document-id"]}
```

Response:

```json
{
  "answer": "Evidence-grounded answer",
  "sources": [
    {"judgment":"Case name","location":"Page 4"}
  ]
}
```

## CORS and HTTPS

The Firebase page is served over HTTPS, so the EC2 API must also use HTTPS. Its
CORS policy must allow `https://questacase.web.app`,
`https://questacase.firebaseapp.com`, and local development only. The S3 bucket
must allow direct `PUT` requests from the same origins; a starting configuration
is provided in `s3-cors.example.json`.

CORS is not authentication. Protect the public EC2 API with suitable
authentication and rate limiting before exposing it beyond a controlled demo.

## Build and deploy to Firebase

`NEXT_PUBLIC_BACKEND_URL` is embedded at build time. Set it in `.env.production`
or in the build environment:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.example.com/api/v1 npm run build
```

The static site is generated in `out/`. The repository is configured for Firebase
project `questacase`:

```bash
npm run deploy:firebase
```

Firebase runs `npm run build` automatically before deployment. The Firebase CLI
must already be installed and authenticated; this project does not install it.
