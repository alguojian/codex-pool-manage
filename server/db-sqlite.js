import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'codex_pool.db');

let SQL;
let db;

export async function initDB() {
  SQL = await initSqlJs();
  
  try {
    const buffer = await fs.readFile(DB_PATH);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }
  
  return db;
}

export async function saveDB() {
  if (!db) return;
  const data = db.export();
  await fs.writeFile(DB_PATH, data);
}

export function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// 将 SQL 中的 NOW() 替换为 SQLite 的 datetime('now')
function convertSQL(sql) {
  return sql.replace(/NOW\(\)/g, "datetime('now')");
}

// 模拟 mysql2/promise 的 pool.query 接口
export const pool = {
  async query(sql, params = []) {
    const db = getDB();
    sql = convertSQL(sql);
    const stmt = db.prepare(sql);
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    
    await saveDB();
    return [rows];
  },
  
  async execute(sql, params = []) {
    return this.query(sql, params);
  },
  
  async end() {
    if (db) {
      db.close();
    }
  }
};
