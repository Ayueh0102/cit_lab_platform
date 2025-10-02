# Repository Guidelines

## Project Structure & Module Organization
- `alumni-platform/`: React 19 + Vite 6 frontend; business logic lives under `src/` with UI primitives in `components/` and hooks in `hooks/`.
- `alumni_platform_api/`: Flask 3 service; entry-point is `src/main.py`, blueprints in `src/routes/`, models and seed data in `src/models/`.
- `dist/` and `alumni_platform_api/static/` contain build artifacts; avoid editing them directly.
- Documentation, samples, and setup scripts sit at the repo root (e.g., `project_documentation.md`, `deploy.sh`, `csv_samples/`).

## Build, Test, and Development Commands
- Frontend: `cd alumni-platform && pnpm install && pnpm dev` starts Vite on `http://localhost:5173`; use `pnpm build` for production assets.
- Run static checks with `pnpm lint`; fix issues before submitting.
- Backend: `cd alumni_platform_api && python3 -m venv venv && source venv/bin/activate` to create an isolated environment.
- Install dependencies via `pip install -r requirements.txt` and launch the API with `python src/main.py` (serves on `http://localhost:5001`).

## Coding Style & Naming Conventions
- JavaScript/JSX files use ES modules, 2-space indentation, PascalCase components, and camelCase utilities; keep Tailwind classes sorted logically in JSX.
- Respect the shared ESLint config (`eslint.config.js`); run `pnpm lint --fix` only after reviewing changes.
- Python modules follow PEP 8: 4-space indentation, snake_case functions, and blueprints named `<feature>_bp` to mirror existing routes.

## Testing Guidelines
- No automated test suite yet; treat `pnpm lint` and manual end-to-end flows (login, jobs, events) as the minimum regression pass.
- When touching seeding logic in `src/main.py`, confirm demo accounts still authenticate with the credentials listed in `README.md`.
- Document any new test scripts or data fixtures in `project_documentation.md` so agents can reproduce results.

## Commit & Pull Request Guidelines
- Git history currently uses short, celebratory summaries (e.g., `🎉 Initial commit: Alumni Platform`); keep messages concise, imperative, and scoped to one concern.
- Reference related docs or issues in the body, list verification steps (`pnpm dev`, `python src/main.py`), and attach UI screenshots for notable visual changes.
- PRs should call out affected backend routes or frontend views, note schema migrations, and mention any new environment variables.

## Security & Configuration Tips
- Move secrets such as `SECRET_KEY` into environment variables before deploying; document expected keys in a sample `.env`.
- Use the provided demo credentials only for local testing and scrub them from screenshots or external reports.
