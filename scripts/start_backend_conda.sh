#!/bin/bash

# 啟動後端服務（使用 conda 環境）
# Usage: ./scripts/start_backend_conda.sh

cd "$(dirname "$0")/../alumni_platform_api"

echo "🔧 啟動 conda 環境..."
eval "$(conda shell.bash hook)"
conda activate alumni-platform

echo "🚀 啟動後端服務..."
python src/main_v2.py

