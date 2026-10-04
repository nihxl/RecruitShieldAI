# Model Service Stub

This is a FastAPI service that provides predictions for the RecruitShield AI application.

## Endpoints

- `GET /health`
- `POST /predict` (takes `{ text }`, returns `{ fraudProbability, modelVersion, truncated }`)

Currently, this is a stub. It returns 503 until the real model checkpoint is implemented.
