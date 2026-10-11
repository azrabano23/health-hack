# Azure options for ScarletWell

*Written Saturday night, 2026-10-11, after the feature freeze. Read `SOURCE_OF_TRUTH.md` first. Rule 6 applies to everything below: a sponsor service is named on a slide only if it is running in the demo. Section 6 of the source of truth already allows "Amazon Location or Azure Maps" for the geocoder pass and the `claude/azure-heat` branch added an Azure Maps heat layer to the staff view. Nothing else from Azure is in the plan today.*

## 0. Where we stand

- `main` is deployed on AWS: app on S3 and CloudFront, engine on App Runner with Bedrock through the instance role (`infra/aws/template.yaml`, `README.md`).
- Branch `claude/azure-heat` (one commit ahead of its base, not merged) adds `app/src/components/AzureHeatmap.tsx`, imports `azure-maps-control` 3.7.4, renders only when `VITE_AZURE_MAPS_KEY` is set, and draws need (5 minus the n-weighted weekly mean) at the three campus centroids with a `HeatMapLayer`. The staff page shows it under the selected dip with a source line.
- `engine/recommend/verify.py` already sends mail through any SMTP relay when `SMTP_URL` is set and names Azure Communication Services in its docstring. Nothing Azure-specific is coded.
- `README.md` line 8 says `infra/fhir/` holds a mapping credited to the Azure Health Data and AI samples. `infra/fhir/` contains only `.gitkeep`. That credit belongs to the parked glucose plan (`docs/archive/`) and should be removed or reworded before the deck quotes the README.
- The samples repository is cloned at `data/raw/azure-health-samples/` (git-ignored, head 8bd94f8f, 2026-09-09).

## 1. What is in the samples repository

Repository: https://github.com/Azure-Samples/azure-health-data-and-ai-samples. Its README says the samples "should be used for testing purposes only with sample data" and that the repo "is not intended for use as a medical device or to perform any analysis or any medical function." Every sample assumes an Azure Health Data Services FHIR service, a DICOM service, or a MedTech service, which are stores for protected health information. We hold no PHI and store nothing server side, so these are reference material, not building blocks.

| Folder | One line | Clinical PHI system? | Fit for us |
|---|---|---|---|
| `sample-postman-queries` | Postman collection of FHIR searches and CRUD requests against the FHIR service. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/sample-postman-queries | Yes | None. We have no FHIR store. |
| `analytics-visualization` | FHIR data flattened to parquet in Data Lake, external tables in Synapse, quality measures in Power BI. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/analytics-visualization | Yes | None. Our aggregate is a synthetic CSV with k >= 5 enforced in engine code. |
| `azuredatabricks-deltalake` | FHIR service export into Databricks Delta Lake bronze, silver, gold tables. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/azuredatabricks-deltalake | Yes | None. |
| `smartonfhir-smart-v1`, `smartonfhir-smart-v2`, `smartonfhir-smartnative-v2` | SMART on FHIR app launch and OAuth scopes against the FHIR service, with APIM, Functions and Entra ID. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/smartonfhir-smart-v2 | Yes | None. SMART is for EHR-launched clinical apps. |
| `SMART-Client-Application` | ASP.NET Core 8 client showing all four SMART v2 flows against Entra ID or Okta. | Yes | None. |
| `patientandpopulationservices-smartonfhir-oncg10-smart-v1` and `-v2` | Everything needed to pass the ONC (g)(10) Inferno certification test suite: FHIR service, APIM, Functions, Key Vault, Storage. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/patientandpopulationservices-smartonfhir-oncg10-smart-v2 | Yes, certified EHR API | None. Weeks of work and a regulatory target we do not have. |
| `fhir-terminology-service-integration` | One endpoint in front of the FHIR service and an external terminology server. | Yes | None. |
| `fhir-aad-b2c`, `fhir-aad-entra-external` | ARM templates to grant FHIR access through Azure AD B2C or Entra External ID. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/fhir-aad-b2c | Yes | None. |
| `client-assertion-generator` | Builds a JWT client assertion and JWKS from a Key Vault certificate for backend OAuth. | Supporting | None. Our wearable OAuth is PKCE in `engine/recommend/wearables.py`. |
| `lift-shift` | PowerShell to migrate custom search parameters from Azure API for FHIR to the FHIR service. | Yes | None. |
| `ExportImportResources` | FHIR bulk export and import helpers (no README). | Yes | None. |
| `USCore6-test-data`, `USCore7-test-data` | Synthetic US Core FHIR bundles for testing a FHIR server. | Test data for a PHI system | None for the demo. Synthea already covers this and the source of truth skips it. |
| `dicom-demo-env` | A simulated on-prem radiology network (Orthanc PACS, a modality) plus the DICOM service. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/dicom-demo-env | Yes, imaging | None. |
| `medtech-service-mappings` | Device and FHIR destination mapping JSON plus test messages for the MedTech service. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/medtech-service-mappings | Yes, device data into a FHIR store | None, and the service is deprecated (see 3). |
| `fabric-healthcare-data-solutions` | A notebook that moves Healthcare data solutions items between Fabric workspaces under ALM. https://github.com/Azure-Samples/azure-health-data-and-ai-samples/tree/main/samples/fabric-healthcare-data-solutions | Yes | None. |

What is not in this repository, despite its name: there is no de-identification sample, no Text Analytics for health sample, and no Azure OpenAI sample. The README's only AI heading is "Analytics and machine learning" and it holds the two parquet pipelines above. Those services exist, they are just documented elsewhere (section 2).

## 2. Five Azure services that would help, ranked

Ranking is by value to the demo path divided by effort tonight, with the freeze in mind: after Saturday 10 PM the rule is bug fixes, deck and rehearsal. Anything below that is not already on a branch is a pilot item unless the team decides otherwise.

### 2.1 Azure Maps: heat layer (started), walking time, geocoder pass

What it gives us. Three things, in order of readiness.

1. The staff heat layer on `claude/azure-heat`. Already written. Web SDK package: https://www.npmjs.com/package/azure-maps-control. Heat map layer docs: https://learn.microsoft.com/en-us/azure/azure-maps/map-add-heat-map-layer.
2. A real walking time for "You are a 4 minute walk from Paul Robeson Campus Center." Today `engine/recommend/nudge.py` computes `walk_min` as straight-line distance at 4.8 km/h (`WALK_KMH`). Route Directions returns distance and estimated travel time for `travelMode: "walking"` with a `POST https://atlas.microsoft.com/route/directions?api-version=2025-01-01` and a GeoJSON body of two waypoints. https://learn.microsoft.com/en-us/rest/api/maps/route/post-route-directions
3. The geocoder pass the source of truth already allows. 118 of 125 rows in `data/rutgers_resources.json` carry `coords_approx: true` (hand-placed, 100 to 200 m). `scripts/add_resource_coords.py` points at a `scripts/geocode_resources.py` that does not exist yet. `GET https://atlas.microsoft.com/geocode?api-version=2026-01-01&query=...` returns coordinates and address parts. https://learn.microsoft.com/en-us/rest/api/maps/search/get-geocoding

Integration sketch.
- App: merge `claude/azure-heat`; set `VITE_AZURE_MAPS_KEY` in `app/.env.local` and pass it through `infra/aws/deploy.sh` next to `VITE_GOOGLE_MAPS_API_KEY` so the production build bakes it in. The component renders nothing without the key, so fixtures mode and CI are unchanged.
- Engine: in `nudge.py`, when `AZURE_MAPS_KEY` is set, make one Route Directions call for the chosen place only, replace `walk_min`, and attach `"source": "Azure Maps Route Directions, walking"` so the app can show it on hover (rule 2). Keep the straight-line estimate as the fallback and label it "straight line" so no number is unsourced. Same for `/checkin/feedback` if the walk time is shown there.
- Data: write `scripts/geocode_resources.py` that reads `address` per row, calls Geocoding, writes `lat`, `lng`, drops `coords_approx`, and records `geocoder: "azure-maps-2026-01-01"` on the row. Run from a laptop per `CLAUDE.md`, commit the data with the script.

Cost. Gen2 free monthly transactions: 5,000 base map tiles (one transaction is 15 tiles), 5,000 search, 1,000 routing. https://azure.microsoft.com/en-us/pricing/details/azure-maps/ and https://learn.microsoft.com/en-us/azure/azure-maps/understanding-azure-maps-transactions. A demo day uses a few hundred at most. A subscription needs a payment method or the Azure for Students offer (USD 100 credit, no card, full-time students). https://azure.microsoft.com/en-us/free/students

Caveat. The branch ships the shared key in the browser bundle. Microsoft recommends Entra ID with RBAC or a SAS token for production. https://learn.microsoft.com/en-us/azure/azure-maps/how-to-manage-authentication. Acceptable for a hackathon key that is rotated afterwards; say so if asked.

Effort. Heat layer: 30 minutes (merge, key, one render check). Walking time: 1 to 2 hours with a test and the fallback path. Geocoder: about 1 hour plus a data review (the geocoder is tolerant of partial addresses, so spot-check Newark and Camden rows). Only the heat layer is realistic tonight; the other two are pilot work.

### 2.2 Azure Communication Services Email, through the SMTP door that already exists

What it gives us. A real six-digit code in a real inbox for the Rutgers email step on About you, instead of the on-screen `dev_code` fallback. No code change: `verify.py` already speaks SMTP with STARTTLS on 587 and reads `SMTP_URL` and `SMTP_FROM`.

How ACS does SMTP. Host `smtp.azurecomm.net`, port 587, TLS, username and password issued from a Microsoft Entra application that has access to the Communication Services resource. Prerequisites: an Email Communication Service resource with a provisioned domain (the Azure managed domain gives a `donotreply@<guid>.azurecomm.net` sender in minutes; a custom domain needs DNS verification), that email resource connected to a Communication Services resource, and the SMTP credentials. https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email-smtp/send-email-smtp

Integration sketch.
- Engine env: `SMTP_URL=smtp://<url-encoded smtp username>:<url-encoded client secret>@smtp.azurecomm.net:587` and `SMTP_FROM=DoNotReply@<guid>.azurecomm.net`. `verify.py` parses the URL with `urlparse`, so any `|`, `@` or `/` in the username or secret must be percent-encoded.
- The current default `SMTP_FROM` is `scarletwell-demo@rutgers.edu`; ACS will refuse a sender that is not on a provisioned domain, so `SMTP_FROM` must be set to the managed domain address.
- AWS template: add a `NoEcho` parameter `SmtpUrl` and `SmtpFrom` in `infra/aws/template.yaml` the way `ElevenLabsApiKey` is done, and pass them in `deploy.sh`. The fallback stays: on any mail error the engine returns `dev_code` with a plain reason.
- Test once with a `scarletmail.rutgers.edu` address during rehearsal; a managed-domain sender may land in spam the first time.

Cost. USD 0.00025 per email plus USD 0.00012 per MB transferred. https://learn.microsoft.com/en-us/azure/communication-services/concepts/email-pricing. A hackathon spends cents.

Effort. 45 to 90 minutes of portal work, zero code. The one engine change is the two env vars, which is a configuration fix, not a feature, so it fits inside the freeze if the team wants it.

Not SMS tonight. The phone field exists, but US toll-free SMS numbers are blocked until a verification application is approved, and that review "can typically take between 5-6 weeks." 10DLC needs brand and campaign registration first. https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms/sms-faq and https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms-pricing (toll-free number USD 2 per month, USD 0.0075 per segment). Browser notifications remain the nudge channel for the demo.

### 2.3 Azure Container Apps for the engine, Azure Static Web Apps for the app

What it gives us. A second home for the same Docker image and the same `app/dist`, useful only as insurance against an App Runner problem or if the team wants the hosting slide to say Azure. It is not a feature.

Container Apps. `az containerapp up` builds from source or takes an image, creates the environment and registry, and deploys with an HTTPS ingress. https://learn.microsoft.com/en-us/azure/container-apps/quickstart-code-to-cloud. Consumption plan free grant per subscription per month: 180,000 vCPU-seconds, 360,000 GiB-seconds, 2 million requests; apps scale to zero by default. https://learn.microsoft.com/en-us/azure/container-apps/billing

Static Web Apps. Free plan: 100 GB bandwidth per month, 250 MB per environment, 2 custom domains. https://learn.microsoft.com/en-us/azure/static-web-apps/quotas. SPA routing needs a `staticwebapp.config.json` with `navigationFallback.rewrite` set to `/index.html`, the equivalent of the CloudFront 403 and 404 custom error responses in `template.yaml`. https://learn.microsoft.com/en-us/azure/static-web-apps/configuration

Integration sketch.
- Engine: `docker build -f infra/aws/Dockerfile .` already produces the image; push it to an Azure Container Registry and `az containerapp up --image ... --ingress external --target-port 8000`. Set `--min-replicas 1` for the demo so the first request does not pay a cold start.
- Model access changes. On App Runner the engine reaches Bedrock through the instance role (`SCARLETWELL_BEDROCK=1`). On Azure there is no AWS role, so `llm.available()` needs `ANTHROPIC_API_KEY`, or `AWS_REGION` plus `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as Container Apps secrets. Guardrail headers still work with keys.
- App: `VITE_USE_FIXTURES=0 VITE_API_URL=https://<containerapp>.azurecontainerapps.io npm run build`, add `app/public/staticwebapp.config.json` so it lands in `dist`, deploy with the SWA CLI. https://azure.github.io/static-web-apps-cli/
- A new `infra/azure/deploy.sh` mirroring `infra/aws/deploy.sh`; do not touch the AWS files.

Effort. 2 to 3 hours including the CORS check and one full demo path on the new URL. This is a hosting change after the freeze and it doubles the number of things that can break Sunday morning. Recommended only as a documented fallback, not as the primary URL.

Why not Azure Functions. FastAPI on Functions needs the Python v2 model and an ASGI wrapper; Container Apps runs the existing Dockerfile unchanged. https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python

### 2.4 Azure AI Language, Text Analytics for health, as a second reader in `understand.py`

What it gives us. `engine/recommend/understand.py` turns a student's own note into a fixed JSON shape (family history flags, conditions, allergies, medications mentioned, diet, faith, observances, notes). Rules run first; the Claude call through `llm.complete` adds on top and may never remove. Text Analytics for health extracts medical entities from free text in one call: named entity recognition (diagnosis, medication name, symptom or sign, age, SDOH), relation extraction, UMLS entity linking, and assertion detection. https://learn.microsoft.com/en-us/azure/ai-services/language-service/text-analytics-for-health/overview

Why it maps well. Assertion detection returns `association: "other"` when a concept belongs to someone other than the subject (that is our "family" flag, which the rules approximate with a relative-word regex) and `certainty: "negative"` when the note denies something ("no diabetes"). https://learn.microsoft.com/en-us/azure/ai-services/language-service/text-analytics-for-health/concepts/assertion-detection

Why it is only a second reader. It has no notion of faith, diet labels or observances, which are most of `SHAPE`. The Claude call covers the whole shape in one request with the exact instruction "never infer, guess or diagnose." Text Analytics for health would fill `family.*`, `conditions`, `medications_mentioned` and little else, so it complements rather than replaces. Microsoft's own notice says the capability "is not intended or made available for use as a medical device, clinical support, diagnostic tool"; our use is extraction of what a student typed, shown back as removable chips, never a label, which is inside that line and inside rule 3. Skip UMLS links; the customer must license UMLS vocabularies separately (same page).

Integration sketch.
- New `engine/recommend/ta4h.py` with one function `read(text) -> partial SHAPE` using `azure-ai-textanalytics` (`begin_analyze_healthcare_entities`). https://pypi.org/project/azure-ai-textanalytics/
- Env: `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY`. In `understand()`, after the rules and before or instead of the model, merge the Azure result with the existing `_merge` (rules win, additions only) and report `method: "azure_ta4h"` or `"azure_ta4h+<model>"` so the app can show the source.
- Map entity categories to our keys: `Diagnosis` or `SymptomOrSign` with `association != other` to `conditions`; the same with `association == other` to `family.other` (and to `family.diabetes`, `heart`, `mental_health` by keyword); `MedicationName` to `medications_mentioned`; drop anything with `certainty` negative. Run every chip through `llm.clean()` so no forbidden word reaches the screen.
- Add `azure-ai-textanalytics` to `engine/requirements.txt`; the Dockerfile picks it up.

Cost. The Language pricing table lists Text analytics for health in the Standard tier with an "Included" band before the first paid band at 0.005M text records (a text record is 1,000 characters). It is not in the list of features that share the general 5,000 free records, so read the live page before assuming free. https://azure.microsoft.com/en-us/pricing/details/language/

Effort. 2 to 3 hours with a test over the existing `understand` fixtures. Pilot item, not tonight. Value for judges: a named health NLP service on the About you page, but only if it runs.

Related: PII redaction. The Language PII feature redacts names, phone numbers and health identifiers from text and offers synthetic replacement in preview. https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/how-to/redact-text-pii. Its one fit here is the stretch "share a wellness win" anonymous card: scrub a name a student typed before anyone else sees it. Not built this weekend.

### 2.5 Azure OpenAI (with Azure AI Content Safety) as a second model door in `llm.py`

What it gives us. Redundancy if Bedrock quota or the Claude API is unavailable during the demo. `engine/recommend/llm.py` is one door with two backends (Claude API, Bedrock). A third backend changes nothing for callers: `clean()` and `plain()` stay the gate for every reply.

How. The `openai` Python package with `base_url="https://<resource>.openai.azure.com/openai/v1/"` and `api_key=AZURE_OPENAI_API_KEY`; the `model` argument is the deployment name, not the model name. https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/switching-endpoints. Azure OpenAI deployments pass prompts and completions through a default Content Safety configuration. https://ai.azure.com/catalog/models/gpt-4.1. The standalone Content Safety text API (hate, sexual, violence, self-harm severities, custom blocklists) is the Azure analogue of the Bedrock Guardrail if the team wants a managed check in addition to the forbidden-word list; its free tier is 5,000 text records per month. https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview and https://azure.microsoft.com/en-us/pricing/details/content-safety/

Integration sketch.
- Env: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`. `available()` returns true when they are set; `_client()` returns `("azure_openai", deployment)`.
- `complete()` builds `[{"role": "system", "content": system}] + messages` and reads `choices[0].message.content`. The `image` path (used by `/food/photo`) sends Anthropic content blocks today and would need the OpenAI `image_url` shape; simplest is to leave images on the Anthropic doors and return `(None, "no_image_support")` on this one.
- Add `openai` to `engine/requirements.txt`. `/llm/status` already reports the active door, so the slide claim is checkable.

Cost. Pay per token by deployment; needs an Azure OpenAI or Foundry resource and a model deployment. Some newer model families require registration (the Foundry Agent Service region page lists the GPT-5 family as registration required). https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/models

Effort. 1 to 2 hours plus portal time for the resource and deployment. Lowest rank because it adds a second model vendor to a story that is already "Claude on Bedrock with Guardrails"; two vendors on one slide invites a question we do not need. Keep it as a documented fallback.

### Evaluated and set aside (not in the five)

- Azure Data Explorer or Fabric for the k-anonymous aggregate. The aggregate is 15,738 synthetic check-ins rolled into `wellness_aggregate_weekly.json` with k >= 5 enforced in `engine/aggregate/`. Moving the roll-up into KQL or a Fabric lakehouse moves rule 4 out of the engine, which is the opposite of the privacy slide. The ADX free cluster (about 100 GB uncompressed, no subscription or card, no SLA) is a reasonable pilot-scale home for staff queries later. https://learn.microsoft.com/en-us/azure/data-explorer/start-for-free
- Azure Health Data Services de-identification service. Three operations (tag, redact, surrogate) over 27 PHI entity types including the 18 HIPAA identifiers, billed per MB with a free allotment shown on the pricing page, 50 KB per request. https://learn.microsoft.com/en-us/azure/healthcare-apis/deidentification/overview and https://azure.microsoft.com/en-us/pricing/details/health-data-services/. We have no clinical text. Its one honest future use is the ask on slide 10: if ScarletWell shares a de-identified export, this is a tool Rutgers could use to produce it. Say that as a future step, never as something we run.
- MedTech service for wearables. See section 3.

## 3. What not to use, and why

1. **Any FHIR service, SMART on FHIR, (g)(10), B2C, terminology, Postman, lift-shift or export sample.** They exist to hold and expose patient records. Loading check-ins or synthetic students into a FHIR service turns a wellness check-in into a clinical record with Observation and Condition resources, which is diagnosis framing by data model (rule 3, section 9). Each needs Entra app registrations, APIM and Functions; the (g)(10) samples are weeks of work. Pricing is per API request and per GB stored on top. https://azure.microsoft.com/en-us/pricing/details/health-data-services/
2. **MedTech service for wearable ingestion.** Microsoft began deprecating it on 3 May 2025, with support ending 3 May 2028, and points to an open-source version. It reads device messages from Event Hubs and persists them as FHIR Observations in a FHIR service, so it requires both. https://learn.microsoft.com/en-us/azure/healthcare-apis/iot/overview and https://learn.microsoft.com/en-us/azure/healthcare-apis/iot/deploy-choose-method. Our line in 2.7 is "No wearable value is stored by the engine or reaches the aggregate, ever." `engine/recommend/wearables.py` keeps OAuth tokens in process memory and hands rows to the phone. MedTech is the opposite design.
3. **DICOM service.** Imaging. Nothing in the product.
4. **Databricks, Synapse, Fabric Healthcare data solutions.** FHIR-shaped analytics pipelines for clinical data at hospital scale. Our staff view runs from one JSON file and must keep the k >= 5 rule in engine code.
5. **De-identification service in the demo.** We have no PHI to de-identify; running it on synthetic text would imply we do. Future step only (2, set aside).
6. **ACS SMS for nudges this weekend.** Toll-free verification takes 5 to 6 weeks and unverified numbers are blocked to US destinations; 10DLC needs brand and campaign registration. https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms/sms-faq
7. **Text Analytics for health as the source of any label shown to a student.** Extraction of the student's own words is fine; any output that reads as a diagnosis, severity or score breaks rule 3 and Microsoft's own terms. Keep `llm.clean()` in front of every chip.
8. **Azure for its own sake on the hosting slide.** `main` runs on AWS today. A second cloud after the freeze is risk with no demo-path value.

## 4. Say on the slide only if running

Consistent with rule 6 and section 6 of the source of truth. Each line has a check the presenter can do five minutes before.

| Say | Only if |
|---|---|
| "Azure Maps" (staff heat layer) | `claude/azure-heat` is merged, `VITE_AZURE_MAPS_KEY` was set in the deployed build, and the heat card renders under a selected dip during rehearsal. |
| "Azure Maps" (walking time or geocoded coordinates) | `walk_min` carries the Azure source on hover, or `data/rutgers_resources.json` rows carry `geocoder: "azure-maps-..."` and no `coords_approx`. |
| "Azure Communication Services" | The deployed engine has `SMTP_URL` on `smtp.azurecomm.net` and a code mail arrived at a `scarletmail.rutgers.edu` inbox during rehearsal (`/verify/send` returns `sent: true`). |
| "Azure Container Apps" or "Azure Static Web Apps" | The URL on the demo laptop is the Azure one. |
| "Azure AI Language" | `/profile/understand` returns `method` containing `azure_ta4h` on the demo engine. |
| "Azure OpenAI" or "Azure AI Content Safety" | `/llm/status` reports the Azure door and a feedback card was polished through it in rehearsal. |
| Never | FHIR service, MedTech, DICOM, Fabric, the de-identification service, or the samples repository as part of our architecture. The de-identification service may appear in the slide 10 ask only as something Rutgers could use to produce an export for us. |

If none of the checks pass, the slide keeps today's list: AWS Bedrock with Guardrails, Google Maps Platform, and nothing else. Also fix the `README.md` line that credits the Azure samples for an `infra/fhir` mapping that is not there.
