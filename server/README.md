# Kids Fight WebSocket Server

This is the WebSocket server component for the Kids Fight multiplayer game.

## Local Development

To run the server locally:

```bash
cd server
npm install
npm start
```

The server will run on port 8081 by default, or the port specified in the PORT environment variable.

## Deployment

The server is configured to deploy on Render.com using the `render.yaml` file in the project root.

### Deployment Steps

1. Create an account on [Render.com](https://render.com/)
2. Connect your GitHub repository to Render
3. Click "New Web Service" and select your repository
4. Render will automatically detect the `render.yaml` config
5. Click "Create Web Service"

## Environment Variables

- `PORT`: The port the server will listen on (default: 8081)
- `NODE_ENV`: Set to 'production' for production deployments
