Goal: Make all merge-eligible PRs merge themselves.

Definition (merge-eligible PR):
- Open pull request in the canonical repository (not a fork) targeting the default branch.
- Labeled `automerge` and missing any blocking labels (`do not merge`, `blocked`, `wip`, `hold`).
- Not a draft and not marked as `work-in-progress` in the title.
- Required status checks are green and the branch is up to date or can be updated automatically.
- At least one approving review and no pending "changes requested" reviews.

Runbook:
1. Poll GitHub for PRs with the `automerge` label.
2. For each candidate, fetch detailed status (mergeable state, required checks, review state, branch status).
3. If the PR fails any definition item, leave a status comment explaining the block and remove the `automerge` label.
4. If the branch is behind but updateable, call `UpdatePullRequestBranch` and re-evaluate once the sync succeeds.
5. When the PR meets all requirements and mergeable state is `clean`/`unstable`, call `EnablePullRequestAutoMerge` with squash merge and commit message `${title} (#${number})`.
6. Monitor for `auto_merge_request` events; if GitHub disables auto-merge (e.g., new failing check or new review), surface the event to maintainers.
7. After the PR merges, post a confirmation comment and remove the `automerge` label if GitHub did not automatically.

Edge cases & safety:
- Ignore PRs authored by bots unless explicitly labeled `allow-automerge`.
- Abort and alert if GraphQL reports `MERGEABLE_STATE=DIRTY` or `BLOCKED` after two consecutive checks.
- Never merge PRs that modify release/version bump files without an explicit `release-ok` label.
