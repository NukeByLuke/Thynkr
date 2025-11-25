#!/bin/bash
# Deployment script for language feature update
# Run this on the DigitalOcean droplet at 138.197.208.81

set -e

echo "=== Pulling new Docker images ==="
docker pull nukebyluke/thynkr-backend:2025-11-01-language
docker pull nukebyluke/thynkr-frontend:2025-11-01-language

echo ""
echo "=== Updating docker-compose to use new images ==="
cd /root || cd ~

# If docker-compose.prod.yml exists, use it
if [ -f "docker-compose.prod.yml" ]; then
  echo "Using docker-compose.prod.yml"
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
elif [ -d "thynkr" ] && [ -f "thynkr/docker-compose.prod.yml" ]; then
  echo "Using thynkr/docker-compose.prod.yml"
  cd thynkr
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
else
  echo "No docker-compose.prod.yml found. Restarting containers manually..."
  docker stop root-backend-1 root-frontend-1
  docker rm root-backend-1 root-frontend-1
  
  # Restart with latest tags (they now point to the new images)
  docker run -d --name root-backend-1 \
    --network root_thynkr-network \
    -e NODE_ENV=production \
    -e DATABASE_URL="${DATABASE_URL}" \
    -e REDIS_URL="${REDIS_URL}" \
    -e JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}" \
    -e JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}" \
    -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
    -v /root/uploads:/app/uploads \
    nukebyluke/thynkr-backend:latest
  
  docker run -d --name root-frontend-1 \
    --network root_thynkr-network \
    -p 80:80 \
    nukebyluke/thynkr-frontend:latest
fi

echo ""
echo "=== Checking container status ==="
docker ps

echo ""
echo "=== Backend logs (last 40 lines) ==="
docker logs root-backend-1 --tail=40

echo ""
echo "=== Frontend logs (last 40 lines) ==="
docker logs root-frontend-1 --tail=40

echo ""
echo "=== Deployment complete! ==="
echo "Next steps:"
echo "1. Visit your site at http://138.197.208.81"
echo "2. Log in and go to Settings"
echo "3. Change your language preference"
echo "4. Upload a file and generate summary/notes/quiz/flashcards"
echo "5. Verify content is in your chosen language"
