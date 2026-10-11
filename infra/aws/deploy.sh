#!/usr/bin/env bash
# One command: build and push the engine, create or update the stack, build the app against it, sync to S3.
# Needs: aws cli (logged in), docker, node. Optional env: AWS_REGION (default us-east-1), STACK, BEDROCK_GUARDRAIL_ID, ELEVENLABS_API_KEY, SITE_DOMAIN, HOSTED_ZONE_ID, CERT_ARN,
# SCARLETWELL_BEDROCK_MODEL, VITE_GOOGLE_MAPS_API_KEY (baked into the app build; never committed).
set -euo pipefail
cd "$(dirname "$0")/../.."

REGION=${AWS_REGION:-us-east-1}
STACK=${STACK:-scarletwell}
REPO=scarletwell-engine
TAG=$(git rev-parse --short HEAD)
ACCT=$(aws sts get-caller-identity --query Account --output text)
IMG=$ACCT.dkr.ecr.$REGION.amazonaws.com/$REPO

aws ecr describe-repositories --repository-names $REPO --region $REGION >/dev/null 2>&1 ||
  aws ecr create-repository --repository-name $REPO --region $REGION >/dev/null
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCT.dkr.ecr.$REGION.amazonaws.com
docker build --platform linux/amd64 -f infra/aws/Dockerfile -t $IMG:$TAG .   # App Runner runs x86_64; Apple silicon needs the flag
docker push $IMG:$TAG

aws cloudformation deploy --region $REGION --stack-name $STACK --template-file infra/aws/template.yaml \
  --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset \
  --parameter-overrides ImageUri=$IMG:$TAG GuardrailId="${BEDROCK_GUARDRAIL_ID:-}" \
  ElevenLabsApiKey="${ELEVENLABS_API_KEY:-}" SiteDomain="${SITE_DOMAIN:-}" HostedZoneId="${HOSTED_ZONE_ID:-}" \
  CertificateArn="${CERT_ARN:-}" \
  BedrockModelId="${SCARLETWELL_BEDROCK_MODEL:-us.anthropic.claude-sonnet-4-5-20250929-v1:0}"

out() { aws cloudformation describe-stacks --region $REGION --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }

(cd app && npm ci && VITE_USE_FIXTURES=0 VITE_API_URL=$(out ApiUrl) npm run build)
aws s3 sync app/dist s3://$(out BucketName) --delete --region $REGION
aws cloudfront create-invalidation --distribution-id $(out DistributionId) --paths '/*' >/dev/null

echo "app:    $(out SiteUrl)"
echo "engine: $(out ApiUrl)/llm/status"
