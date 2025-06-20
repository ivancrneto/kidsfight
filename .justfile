dev:
  rm -rf node_modules/.cache && \
    rm -rf dist && \
    rm -rf build && \
    rm -rf .parcel-cache && \
    rm -rf .parcel-cache dist && npm run build && npm start

deploy:
  npm run build && netlify deploy --prod --dir=dist
