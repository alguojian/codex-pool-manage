#!/usr/bin/env node

/**
 * 自动安装 Codex CLI（如果未安装）
 * 在 npm install 后自动运行
 */

import { execSync } from 'child_process';
import os from 'os';

function isCodexInstalled() {
  try {
    execSync('npm list -g @openai/codex', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installCodex() {
  console.log('📦 检测到 Codex CLI 未安装，正在自动安装...');
  
  try {
    // 使用官方 npm 源安装
    execSync('npm install -g @openai/codex --registry=https://registry.npmjs.org', {
      stdio: 'inherit',
    });
    console.log('✅ Codex CLI 安装成功！');
    return true;
  } catch (error) {
    console.warn('⚠️  Codex CLI 自动安装失败，你可以手动安装：');
    console.warn('   npm install -g @openai/codex --registry=https://registry.npmjs.org');
    console.warn('');
    console.warn('   或者在项目中使用"扫描"功能手动导入 auth 文件');
    return false;
  }
}

// 主逻辑
if (isCodexInstalled()) {
  console.log('✅ Codex CLI 已安装');
} else {
  installCodex();
}
