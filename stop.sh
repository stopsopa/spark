#!/bin/bash
kill -SIGTERM $(ps aux | grep "server.jsx" | grep -v grep | head -1 | awk '{print $2}')
kill -SIGTERM $(ps aux | grep "server.jsx" | grep -v grep | head -1 | awk '{print $2}')
