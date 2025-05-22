dev:
  rm -rf .parcel-cache dist && npm start

deploy:
  npm run build && netlify deploy --prod --dir=dist
