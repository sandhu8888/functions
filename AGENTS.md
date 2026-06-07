# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **gallery of independent Azure Functions samples**, not a single deployable app. Each subdirectory under `starters/` and `ai/` is its own project with its own dependencies and `local.settings.json`.

### System prerequisites (VM image)

These are installed once on the VM (not in the update script):

- **Azure Functions Core Tools v4** (`func`) — required for all Function samples
- **Node.js** (16+) — JavaScript/TypeScript samples
- **Python 3.8+** with `python3.12-venv` — Python samples
- **Java 17 + Maven** — Java starter (`starters/java/`)
- **.NET 7 SDK** — .NET starters and AI samples

### Representative local dev flow (JavaScript v4 starter)

The quickest end-to-end smoke test uses `starters/javascriptv4/`:

1. **Azurite** (storage emulator) — required when `AzureWebJobsStorage=UseDevelopmentStorage=true`:
   ```bash
   cd starters/javascriptv4
   npx azurite --silent --location /tmp/azurite
   ```
   Alternative per README: Docker `mcr.microsoft.com/azure-storage/azurite` on ports 10000–10002.

2. **Create `local.settings.json`** in the sample folder (gitignored; see each sample's README). For JS v4:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsFeatureFlags": "EnableWorkerIndexing"
     }
   }
   ```

3. **Install and run**:
   ```bash
   cd starters/javascriptv4
   npm install
   func start
   ```

4. **Test**: `curl http://localhost:7071/api/http` or `curl "http://localhost:7071/api/http?name=YourName"`

Default Functions host port: **7071**.

### Other samples

| Sample path | Install | Start |
|-------------|---------|-------|
| `starters/python/` | `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` | `func start` |
| `starters/javascriptv3/`, `starters/typescriptv3/` | `npm install` | `func start` or `npm start` |
| `starters/java/` | `mvn clean package` | `mvn azure-functions:run` |
| `starters/dotnet/http/` | `dotnet build` | `func start` |
| `ai/chatgpt/*`, `ai/langchain/python/` | per README | `func start` + cloud API keys |

AI samples need external API keys (`OPENAI_API_KEY`, `AZURE_OPENAI_*`, `AI_URL`/`AI_SECRET`) in `local.settings.json`.

### Lint / test

There is **no root-level linter or test suite**. Individual Node samples expose `npm test` (typically a placeholder). Validate changes by running the relevant sample locally with `func start` and hitting its HTTP endpoint.

### Deployment

Samples with `azure.yaml` deploy via [Azure Developer CLI](https://aka.ms/azd): `azd up` from the sample directory.
