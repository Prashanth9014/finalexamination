# Quick Start Guide

## Starting the Server

```bash
npm run dev
```

The server will automatically:
- Connect to MongoDB
- Find an available port (starting from 5000)
- Start listening and log the port being used

## If Port 5000 is Busy

### Option 1: Automatic (Recommended)
Just run `npm run dev` - the server will automatically use the next available port (5001, 5002, etc.)

### Option 2: Kill the Process on Port 5000
```bash
npm run kill-port
```

Or manually on Windows:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or manually on Linux/Mac:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## Expected Console Output

### Successful Start (Port 5000 Available)
```
Connected to MongoDB
Server running on port 5000
```

### Automatic Port Fallback (Port 5000 Busy)
```
Connected to MongoDB
Port 5000 is busy, trying 5001...
Port 5000 was busy, using port 5001 instead
Server running on port 5001
```

## Common Issues

### Issue: "Could not find available port after 10 attempts"
**Solution:** Ports 5000-5009 are all busy. Free up some ports or change PORT in .env

### Issue: MongoDB connection failed
**Solution:** 
- Check if MongoDB is running locally
- Verify MONGODB_URI in .env file
- Ensure network connectivity for cloud MongoDB

### Issue: Nodemon keeps restarting
**Solution:**
- Check for syntax errors in TypeScript files
- Run `npm run build` to verify compilation
- Check nodemon.json configuration

## Development Workflow

1. Start server: `npm run dev`
2. Make code changes
3. Nodemon automatically restarts
4. Server finds available port on each restart
5. No manual intervention needed

## Environment Variables

Create `.env` file in server directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/online_recruit_system
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=*
```

## API Testing

Once server is running, test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "online-recruit-system-backend",
  "database": "connected"
}
```

## Production Deployment

1. Set environment variables properly
2. Build the project: `npm run build`
3. Start production server: `npm start`
4. Use process manager (PM2) for better control:
   ```bash
   pm2 start dist/server.js --name "recruit-api"
   ```

## Stopping the Server

- Press `Ctrl+C` in terminal
- Server will gracefully shutdown
- MongoDB connection will close properly
- Port will be freed automatically
