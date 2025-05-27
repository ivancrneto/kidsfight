dev:
  rm -rf .parcel-cache dist && npm run build && npm start

deploy:
  npm run build && netlify deploy --prod --dir=dist
