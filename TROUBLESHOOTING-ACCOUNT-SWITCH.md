# 账号切换问题排查指南（Codex CLI）

## 问题现象
点击切换账号后，本地 Codex CLI 没有自动切换到新账号。

## 工作原理
Pool Manager 切换账号时会：
1. 复制目标账号的 auth 文件到 `~/.codex/auth.json`
2. 更新数据库中的活跃账号状态
3. 验证文件是否复制成功

Codex CLI 会自动读取 `~/.codex/auth.json` 文件，无需重启。

## 可能的原因

### 1. 文件权限问题
`~/.codex/auth.json` 可能没有写入权限。

### 2. 路径配置错误
账号的 `auth_file_path` 可能配置错误或文件不存在。

### 3. Codex CLI 缓存
Codex CLI 可能缓存了旧的 auth 信息。

### 4. 文件复制失败
复制过程中可能出现错误。

## 排查步骤

### 步骤 1：使用验证功能
在 Pool Manager 右侧边栏点击 "验证账号切换" 按钮，系统会自动检查：
- Codex auth 文件是否存在
- Token 是否匹配目标账号

### 步骤 2：检查日志
在 Pool Manager 的 Logs 页面查看切换账号时的日志，特别关注：
- `[切换] 已复制 auth 文件到 ...` - 成功
- `[切换失败] ...` - 失败原因
- `[验证] Codex auth 文件切换成功 ✓` - 验证通过
- `[验证] Codex auth 文件不匹配！` - 验证失败

### 步骤 3：手动验证文件
切换账号后，检查文件内容：

```bash
# 1. 查看当前 Codex auth 文件
cat ~/.codex/auth.json | grep -o '"email":"[^"]*"'

# 2. 查看目标账号文件（替换为实际路径）
cat ~/projects/pool-manager/accounts/your-account.json | grep -o '"email":"[^"]*"'

# 3. 比较两个文件的 access_token（前20个字符）
head -c 500 ~/.codex/auth.json | grep -o '"access_token":"[^"]*"' | cut -c 1-40
head -c 500 ~/projects/pool-manager/accounts/your-account.json | grep -o '"access_token":"[^"]*"' | cut -c 1-40
```

### 步骤 4：检查文件权限
```bash
# 检查 ~/.codex 目录权限
ls -la ~/.codex/

# 如果没有写入权限，修复：
chmod 755 ~/.codex
chmod 644 ~/.codex/auth.json
```

## 解决方案

### 方案 1：使用验证功能（推荐）
1. 在 Pool Manager 中切换账号
2. 点击右侧边栏的 "验证账号切换" 按钮
3. 查看验证结果和详细信息

### 方案 2：手动切换
```bash
# 1. 找到目标账号的 auth 文件路径（在 Pool Manager 中查看）
# 例如：~/projects/pool-manager/accounts/user@example.com.json

# 2. 手动复制到 Codex
cp ~/projects/pool-manager/accounts/user@example.com.json ~/.codex/auth.json

# 3. 验证
cat ~/.codex/auth.json | grep -o '"email":"[^"]*"'
```

### 方案 3：重新添加账号
如果账号的 auth 文件路径错误：
1. 在 Pool Manager 中删除该账号
2. 重新扫描并添加账号
3. 确保路径正确

### 方案 4：测试 Codex CLI
切换账号后，测试 Codex CLI 是否使用了新账号：

```bash
# 查看当前账号信息
codex auth status

# 或者发送一个测试请求
codex "hello"
```

## 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `ENOENT: no such file or directory` | auth 文件不存在 | 检查 auth_file_path 配置 |
| `EACCES: permission denied` | 没有写入权限 | 修改文件权限 |
| `codex_file_missing` | ~/.codex/auth.json 不存在 | 手动创建目录 |
| `codex_token_mismatch` | Token 不匹配 | 重新切换账号 |

## 预防措施

### 1. 定期验证
切换账号后使用 "验证账号切换" 功能确认切换成功。

### 2. 查看日志
定期查看 Logs 页面，及时发现问题。

### 3. 健康检查
使用右侧边栏的 "Health Check" 定期检查所有账号状态。

## 调试技巧

### 查看完整的 auth 文件
```bash
# 格式化显示
cat ~/.codex/auth.json | python -m json.tool

# 或使用 jq
cat ~/.codex/auth.json | jq '.'
```

### 监控文件变化
```bash
# 实时监控 auth 文件变化
watch -n 1 'ls -l ~/.codex/auth.json && echo "---" && head -c 200 ~/.codex/auth.json'
```

### 检查 Codex CLI 配置
```bash
# 查看 Codex CLI 使用的配置目录
codex config path

# 查看当前认证状态
codex auth status
```

## 联系支持

如果以上方案都无法解决问题，请提供：
- Pool Manager 日志截图（特别是切换账号时的日志）
- 验证功能的输出结果
- `ls -la ~/.codex/` 的输出
- `codex auth status` 的输出（如果可用）
