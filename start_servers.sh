#!/bin/bash

# Start PETWEB.FINDER Backend on port 5003
echo "Starting PETWEB.FINDER Backend (Port 5003)..."
cd /Users/macbook/.gemini/antigravity/scratch/PETWEB.FINDER/backend
./venv/bin/python3 app.py &
BACKEND_PID=$!

# Start PETWEB.FINDER Frontend on port 3003
echo "Starting PETWEB.FINDER Frontend (Port 3003)..."
cd /Users/macbook/.gemini/antigravity/scratch/PETWEB.FINDER/frontend
python3 -m http.server 3003 &
FRONTEND_PID=$!

echo "PETWEB.FINDER Servers are running."
echo "Frontend: http://localhost:3003"
echo "Backend API: http://localhost:5003"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
