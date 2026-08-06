#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/deploy.sh <tag>  (e.g. ./scripts/deploy.sh v1)"
  exit 1
fi

TAG=$1
DOCKERHUB_USER=your-dockerhub-username   # <-- set this
EC2_HOST=ubuntu@<ec2-ip>                 # <-- set this
SSH_KEY=~/.ssh/your-key.pem              # <-- set this

echo "=== Auditing backend deps ==="
(cd backend && npm audit --audit-level=critical)

echo "=== Building + pushing backend image ==="
docker buildx build --platform linux/amd64 --provenance=false \
  -t ${DOCKERHUB_USER}/net-cert-backend:${TAG} --push ./backend

echo "=== Building + pushing frontend image ==="
docker buildx build --platform linux/amd64 --provenance=false \
  -t ${DOCKERHUB_USER}/net-cert-frontend:${TAG} --push ./frontend-nextjs

echo "=== Scanning images ==="
docker scout quickview ${DOCKERHUB_USER}/net-cert-backend:${TAG}
docker scout quickview ${DOCKERHUB_USER}/net-cert-frontend:${TAG}

echo "=== Deploying to EC2 ==="
ssh -i "$SSH_KEY" "$EC2_HOST" bash -s <<EOF
set -e
cd net-certificate-generator-prod
sed -i "s/^BACKEND_TAG=.*/BACKEND_TAG=${TAG}/" .env
sed -i "s/^FRONTEND_TAG=.*/FRONTEND_TAG=${TAG}/" .env
docker compose build nginx
docker compose pull
docker compose run --rm migrate
docker compose up -d
docker compose ps
bash scripts/security-audit.sh
EOF

echo "=== Deploy complete: ${TAG} ==="