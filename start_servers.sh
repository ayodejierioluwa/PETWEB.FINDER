#!/bin/bash

# Start PETWEB.FINDER Backend on port 5003
echo "Starting PETWEB.FINDER Backend (Port 5003)..."
cd /Users/macbook/.gemini/antigravity/scratch/PETWEB.FINDER/backend
# Assuming it uses the system python or a venv if it exists. 
# It didn't seem to have a venv in the list_dir output, but we'll try to run python3 directly.
python3 app.py &
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
