# Skill Registry — becode

Generated: 2026-07-11
Scope: opencode user skills (user-level)

## Convention Files

_No project-level convention files found (AGENTS.md, CLAUDE.md, .cursorrules, etc.)_

## Skills

| Name                 | Trigger                                                                                                                                                    | Path                                                                   | Scope |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----- |
| branch-pr            | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review.                                           | `/home/opencode/.config/opencode/skills/branch-pr/SKILL.md`            | user  |
| chained-pr           | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus.                               | `/home/opencode/.config/opencode/skills/chained-pr/SKILL.md`           | user  |
| cognitive-doc-design | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.                           | `/home/opencode/.config/opencode/skills/cognitive-doc-design/SKILL.md` | user  |
| comment-writer       | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.                               | `/home/opencode/.config/opencode/skills/comment-writer/SKILL.md`       | user  |
| customize-opencode   | Use ONLY when editing or creating opencode's own configuration: opencode.json, opencode.jsonc, files under .opencode/, or files under ~/.config/opencode/. | `<built-in>`                                                           | user  |
| go-testing           | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns.                                                   | `/home/opencode/.config/opencode/skills/go-testing/SKILL.md`           | user  |
| issue-creation       | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests.                                        | `/home/opencode/.config/opencode/skills/issue-creation/SKILL.md`       | user  |
| judgment-day         | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge.                                | `/home/opencode/.config/opencode/skills/judgment-day/SKILL.md`         | user  |
| skill-creator        | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter.                                    | `/home/opencode/.config/opencode/skills/skill-creator/SKILL.md`        | user  |
| skill-improver       | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills.                                        | `/home/opencode/.config/opencode/skills/skill-improver/SKILL.md`       | user  |
| work-unit-commits    | Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code.                        | `/home/opencode/.config/opencode/skills/work-unit-commits/SKILL.md`    | user  |

## Excluded from Registry

Skills `sdd-init`, `sdd-apply`, `sdd-archive`, `sdd-design`, `sdd-explore`, `sdd-onboard`, `sdd-propose`, `sdd-spec`, `sdd-tasks`, `sdd-verify`, `skill-registry`, and `_shared` are excluded per scan rules.
