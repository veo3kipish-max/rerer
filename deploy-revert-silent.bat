@echo off
echo REVERTING...
git add index.tsx
git commit -m "revert: restore original interface"
git push origin main
call vercel --prod
echo DONE.
