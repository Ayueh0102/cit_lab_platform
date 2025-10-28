SHELL := /bin/bash

.PHONY: dev-up dev-down dev-logs

dev-up:
	@bash scripts/dev_up.sh

dev-down:
	@bash scripts/dev_down.sh

dev-logs:
	@echo "Tailing logs (Ctrl+C to exit)..." && \
	( tail -f .logs/frontend.log .logs/backend.log 2>/dev/null || echo "No logs yet. Run 'make dev-up' first." )

