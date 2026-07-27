@echo off
echo กำลัง export database...
docker compose exec db pg_dump -U pos_user --no-owner pos_db > db\init.sql
echo.
echo สำเร็จ! ข้อมูลถูกบันทึกที่ db\init.sql
echo ตอนนี้สามารถ zip folder ทั้งหมดส่งให้ user ได้เลย
pause
