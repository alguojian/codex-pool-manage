import { initDB, pool, saveDB } from './db-sqlite.js';
import { createSeedAccounts, createSeedTasks, createSeedLogs, defaultSettings } from './seed-data.js';

async function createTables() {
  const db = await initDB();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      email TEXT NOT NULL,
      auth_type TEXT NOT NULL CHECK(auth_type IN ('team', 'plus', 'free')),
      auth_file_path TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'idle', 'error', 'rate_limited', 'cooldown')),
      is_current INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT NOT NULL,
      total_tasks_completed INTEGER NOT NULL DEFAULT 0,
      success_rate REAL NOT NULL DEFAULT 0,
      session_start_at TEXT NOT NULL,
      total_session_seconds INTEGER NOT NULL DEFAULT 0,
      requests_this_minute INTEGER NOT NULL DEFAULT 0,
      tokens_used_percent INTEGER NOT NULL DEFAULT 0,
      last_request_at TEXT NOT NULL,
      uptime_percent REAL NOT NULL DEFAULT 0,
      platform TEXT NOT NULL DEFAULT 'gpt',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      assigned_account_id TEXT NULL,
      status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'completed', 'failed', 'retrying')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
      result TEXT NULL,
      error_message TEXT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      started_at TEXT NULL,
      completed_at TEXT NULL,
      FOREIGN KEY (assigned_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NULL,
      level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      strategy TEXT NOT NULL CHECK(strategy IN ('round_robin', 'least_used', 'random', 'priority_based')),
      auto_rotation INTEGER NOT NULL DEFAULT 1,
      rest_after_tasks INTEGER NOT NULL,
      cooldown_minutes INTEGER NOT NULL,
      rate_limit_buffer INTEGER NOT NULL,
      max_concurrent_tasks INTEGER NOT NULL,
      global_rate_limit INTEGER NOT NULL,
      auto_retry INTEGER NOT NULL DEFAULT 1,
      max_retries INTEGER NOT NULL,
      task_timeout_minutes INTEGER NOT NULL,
      auto_dispatch INTEGER NOT NULL DEFAULT 1,
      openclaw_endpoint TEXT NOT NULL,
      openclaw_api_key TEXT NOT NULL,
      codex_path TEXT NOT NULL,
      trae_path TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('codex', 'trae')),
      auto_launch INTEGER NOT NULL DEFAULT 0,
      auto_token_refresh INTEGER NOT NULL DEFAULT 1,
      token_refresh_interval_hours INTEGER NOT NULL DEFAULT 72,
      auto_kill_codex INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )
  `);
  
  await saveDB();
}

async function createIndexes() {
  const db = await initDB();
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_accounts_is_current ON accounts(is_current)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)',
    'CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)',
    'CREATE INDEX IF NOT EXISTS idx_logs_account_id ON logs(account_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_assigned_account_id ON tasks(assigned_account_id)',
  ];

  for (const sql of indexes) {
    db.run(sql);
  }
  
  await saveDB();
}

async function seedSettings() {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM settings');
  if (rows[0].count > 0) {
    return;
  }

  await pool.execute(
    `INSERT INTO settings (
      id, strategy, auto_rotation, rest_after_tasks, cooldown_minutes, rate_limit_buffer,
      max_concurrent_tasks, global_rate_limit, auto_retry, max_retries, task_timeout_minutes,
      auto_dispatch, openclaw_endpoint, openclaw_api_key, codex_path, trae_path,
      mode, auto_launch, auto_token_refresh, token_refresh_interval_hours, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      defaultSettings.strategy,
      defaultSettings.auto_rotation ? 1 : 0,
      defaultSettings.rest_after_tasks,
      defaultSettings.cooldown_minutes,
      defaultSettings.rate_limit_buffer,
      defaultSettings.max_concurrent_tasks,
      defaultSettings.global_rate_limit,
      defaultSettings.auto_retry ? 1 : 0,
      defaultSettings.max_retries,
      defaultSettings.task_timeout_minutes,
      defaultSettings.auto_dispatch ? 1 : 0,
      defaultSettings.openclaw_endpoint,
      defaultSettings.openclaw_api_key,
      defaultSettings.codex_path,
      defaultSettings.trae_path,
      defaultSettings.mode,
      defaultSettings.auto_launch ? 1 : 0,
      defaultSettings.auto_token_refresh ? 1 : 0,
      defaultSettings.token_refresh_interval_hours,
    ],
  );
}

export async function initDatabase() {
  await createTables();
  await createIndexes();
  await seedSettings();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(async () => {
      await pool.end();
      console.log('SQLite database initialized');
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
