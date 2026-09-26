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
