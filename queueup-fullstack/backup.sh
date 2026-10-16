#!/bin/sh
# Daily MySQL backup. Schedule with cron, e.g.:  30 2 * * * /opt/queueup/backup.sh
# Keeps 14 days. Copy the backups off this server too (another disk, S3, Google Drive...).
set -e
cd "$(dirname "$0")"
. ./.env
mkdir -p backups
FILE="backups/queueup-$(date +%Y-%m-%d_%H%M).sql.gz"
docker compose exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction queueup | gzip > "$FILE"
find backups -name 'queueup-*.sql.gz' -mtime +14 -delete
echo "Backup written: $FILE"
