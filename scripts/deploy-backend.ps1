# Deploy script to update production with new backend and reseed database

$server = "root@138.197.208.81"

Write-Host "🚀 Deploying to production..."

# SSH and run deployment commands
ssh $server @"
    echo '📦 Pulling latest backend image...'
    docker pull nukebyluke/thynkr-backend:latest
    
    echo '🔄 Recreating backend container...'
    cd /root/thynkr
    docker compose up -d --force-recreate backend
    
    echo '⏳ Waiting for backend to be ready...'
    sleep 10
    
    echo '🌱 Reseeding database with internal files...'
    docker compose exec -T backend npx prisma db push --force-reset
    docker compose exec -T backend npx prisma db seed
    
    echo '✅ Deployment complete!'
    docker compose ps
"@
