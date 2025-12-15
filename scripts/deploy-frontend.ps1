# Deploy script to update production with new frontend build

$server = "root@138.197.208.81"

Write-Host "Deploying frontend to production..."

# Build and push frontend Docker image
Write-Host "Building frontend Docker image..."
docker build -t nukebyluke/thynkr-frontend:latest ./frontend

Write-Host "Pushing to Docker Hub..."
docker push nukebyluke/thynkr-frontend:latest

Write-Host "Deploying to DigitalOcean..."
# Sync production configs (nginx + compose)
scp ./nginx.prod.conf ${server}:/root/nginx.prod.conf
scp ./docker-compose.prod.yml ${server}:/root/docker-compose.prod.yml

# SSH and run deployment commands
$deployScript = "cd /root && docker compose -f docker-compose.prod.yml pull frontend && docker compose -f docker-compose.prod.yml up -d --force-recreate frontend && docker system prune -f && docker compose -f docker-compose.prod.yml ps"
ssh $server $deployScript

Write-Host "Deployment finished successfully!"
