# Verifying a dashboard deploy actually landed

The backend exposes `/health`, so confirming what is deployed there is one request:

```bash
curl -s https://electro-back-production.up.railway.app/health
# {"status":"ok","commit":"757e058","uptime_s":5020,"db":"ok","redis":"ok"}
```

`commit` comes from `RAILWAY_GIT_COMMIT_SHA`, which Railway injects at build time
(`src/routes/healthRoutes.js`). Match it against `git rev-parse --short HEAD` and you
know exactly which commit is running.

This dashboard has no equivalent endpoint, and its `middleware.ts` matcher covers
`/(api|trpc)(.*)`, so any version route added here would sit behind login and be
awkward to probe. Until that changes, use the CSS-marker check below.

## The CSS-marker check

Tailwind only emits a utility class if it appears somewhere in the source it scans.
So a class introduced by a specific commit is a reliable fingerprint for "was the
bundle built after that commit".

```bash
# 1. Collect the deployed stylesheets (the login page is public)
curl -s https://dashboard.ayocosmetics.mn/login \
  | grep -o '/_next/static/[^"]*\.css' | sort -u

# 2. Fetch each one and grep for a class only the new build can contain
curl -s "https://dashboard.ayocosmetics.mn/_next/static/<hash>.css" | grep -c 'p-ui-6'
```

Good markers as of the add-product/edit-product rewrite:

| marker | introduced by |
|---|---|
| `p-ui-6`, `space-y-ui-5`, `gap-ui-2` | the scoped `ui-*` px scale in `tailwind.config.js` |
| `min-w-[640px]` | the variants table |
| `rounded-[8px]` | the shared control classes in `components/product-form/fieldStyles.js` |

Always include a control marker that should be present regardless, so a
false negative from fetching the wrong file is obvious. `62.5%` works — it is the
root font-size rule in `public/css/style.css` and is in every build.

This check caught a real case on 2026-08-11: `ayo-back` had deployed its latest
commit within a minute of the push, while this dashboard was still serving a bundle
from before that day's 25 commits. None of the `ui-*` markers were present but the
`62.5%` control was, which is what made the diagnosis unambiguous rather than a
guess about whether the request had hit a cache.

## Notes

- Railway auto-deploy normally lags a push by roughly 15 minutes. Longer than that
  with no new build usually means the service's GitHub trigger needs re-connecting —
  check the other services first, since a single stuck service is not a Railway-wide
  problem.
- Do **not** use `railway up` to force a deploy. It uploads the working directory
  rather than building from the pushed commit, so any uncommitted work in the tree
  ships to production. `railway redeploy`, or the Redeploy button in the Railway UI,
  builds from git and is safe.
