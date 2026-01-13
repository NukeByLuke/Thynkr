# Deploy script to update production with new backend

$server = "root@138.197.208.81"

Write-Host "🚀 Deploying to production..."

# SSH and run deployment commands (use single-line to avoid CRLF issues)
scp ./docker-compose.prod.yml ${server}:/root/docker-compose.prod.yml
$deploy = "echo 'Pulling backend'; docker pull nukebyluke/thynkr-backend:latest; echo 'Recreating backend'; cd /root; docker compose -f docker-compose.prod.yml up -d --force-recreate backend; echo 'Waiting for backend to start'; sleep 5; echo 'Running migrations'; docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy; echo 'Done'; docker compose -f docker-compose.prod.yml ps"
ssh ${server} ${deploy}
