# Assumptions / Mocked Data / Notes

Creator access uses a browser-specific anonymous workspace; public forms require no login. Two published sample forms contain clearly synthetic responses, and each new workspace is seeded once. Preview never stores responses. Advanced logic, integrations, team collaboration and theme/ending customization are labeled placeholders; no optional bonuses are claimed. Published versions preserve historical response questions. The backend uses SQLite on Render Free, whose filesystem is ephemeral: restarts or redeployments may lose user-created data, and keep-alive requests do not guarantee durability. Critical workflows were tested locally; comprehensive cross-browser testing remains limited.

Before submission: confirm the latest Vercel/Render deployments are healthy and make the GitHub repository public.
