# Agent Notes

## Collaboration Workflow

- Make repository changes through pull requests by default.
- Use short-lived branches with the `codex/` prefix for Codex-authored work.
- Keep changes scoped to the requested task unless a broader edit is necessary to keep the project coherent.
- Update `PROJECT_LOG.md` with verbatim user prompts and useful lessons learned during the session.
- Prefer the Nix development shell for project commands so tool versions stay reproducible.
- For UI changes, follow `E2E_GUIDE.md` and commit updated scenario docs and screenshots with the code change.
