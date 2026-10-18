<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep the homepage's integrated side navigation in `src/routes/index.tsx` while shared navigation remains in `Navbar` for inner pages, so the selected asymmetric homepage composition is not duplicated by a top bar.
- Define the ink/lime visual identity as semantic CSS tokens and load Sora/Manrope from the root head, so every view shares the same theme without component-level color literals.
- Keep destination editorial data client-safe and homepage map drafts session-only. Persist a booking only after explicit consent and successful server submission; a saved request is pending review, never an automatic ride confirmation.
- Use semantic pastel tokens and reusable clay surface/button styles in global CSS, so the tactile look applies consistently to home and existing inner pages.

- Preserve customer booking URLs on `visit-hijaz.com`. Serve administration only on `admin.visit-hijaz.com` and driver registration only on `drivers.visit-hijaz.com`; gate staff APIs by hostname before dispatching them.
- Keep admin keys and customer databases outside the repository. Admin keys require at least 32 non-whitespace characters; fail closed when configuration is missing or invalid.
- Build the Oracle Node release with `npm run build:server`. Do not activate a staged release or change service permissions until the owner resolves the existing deployment approval gate.
