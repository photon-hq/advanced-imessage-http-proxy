# Git 提交信息

## 分支名

```
feat/dependabot-auto-release
```

## Commit Message

```
feat: add dependabot auto-merge and release workflow

- Configure Dependabot to monitor @photon-ai/advanced-imessage-kit
- Auto-merge patch and minor version updates
- Auto bump proxy version and create git tags on dependency updates
- Update advanced-imessage-kit to v1.11.2
```

## PR Description

### Summary

添加 Dependabot 自动化配置，实现 `@photon-ai/advanced-imessage-kit` 依赖的自动更新、自动合并和自动发布流程。

### Changes

- **`.github/dependabot.yml`** - 每日检查 kit 更新，自动创建 PR
- **`.github/workflows/dependabot-automerge.yml`** - 自动合并 patch/minor 版本更新
- **`.github/workflows/release-on-deps-update.yml`** - 依赖更新合并后自动 bump 版本并创建 tag
- **`package.json`** - 更新 `@photon-ai/advanced-imessage-kit` 至 `^1.11.2`

### Workflow

```
kit 新版本 → Dependabot PR → Auto-merge → Push to main → Bump version → Create tag
```

### Requirements

- 仓库需启用 **Allow auto-merge** (Settings → General → Pull Requests)
