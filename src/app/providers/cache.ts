import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  CapacitorSQLitePlugin,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { ICacheProvider } from '@resgrid/ngx-resgridlib';

export class CacheProvider implements ICacheProvider {
  private isInitialized: boolean = false;
  private sqliteConnection!: SQLiteConnection;
  private isService: boolean = false;
  private platform!: string;
  private sqlitePlugin!: CapacitorSQLitePlugin;
  private native: boolean = false;

  private readonly db_name = 'rgbbcache';
  private readonly cache_table = 'cache';

  constructor() {}

  public async initializePlugin(): Promise<boolean> {
    this.platform = Capacitor.getPlatform();
    if (this.platform === 'ios' || this.platform === 'android')
      this.native = true;
    this.sqlitePlugin = CapacitorSQLite;
    this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);
    this.isService = true;
    return true;
  }

  public async initWebStore(): Promise<void> {
    try {
      await this.sqliteConnection.initWebStore();
    } catch (err: any) {
      const msg = err.message ? err.message : err;
      return Promise.reject(`initWebStore: ${msg}`);
    }
  }

  public async initialize() {
    console.log(`initializing the cache provider`);

    if (!this.isInitialized) {
      try {
        await this.initializePlugin();
        if (this.platform === 'web') {
          await this.initWebStore();
          console.log('web store initialized');
        }

        const retCC = (
          await this.sqliteConnection.checkConnectionsConsistency()
        ).result;
        const isConn = (
          await this.sqliteConnection.isConnection(this.db_name, false)
        ).result;
        let db: SQLiteDBConnection;

        if (retCC && isConn) {
          db = await this.sqliteConnection.retrieveConnection(
            this.db_name,
            false
          );
        } else {
          db = await this.sqliteConnection.createConnection(
            this.db_name,
            false,
            'no-encryption',
            1,
            false
          );
        }

        if (db === null) {
          console.log(`database.service initialize Error: _db is null`);
        }

        await db.open();
        console.log(`$$$ initialize createConnection successful`);

        await this.ensureTablesExist(db);
        console.log(`$$$ initialize successful`);
        this.isInitialized = true;

        if (this.platform === 'web') {
          await this.sqliteConnection.saveToStore(this.db_name);
        }

        return new Promise<void>((resolve, reject) => {
          resolve();
        });
      } catch (err) {
        console.log(
          `database.service initialize Error: ${JSON.stringify(err)}`
        );
      }
    } else {
      return new Promise<void>((resolve, reject) => {
        resolve();
      });
    }
  }

  private async getConnection(): Promise<SQLiteDBConnection> {
    await this.initialize();
    let db: SQLiteDBConnection;

    const retCC = (await this.sqliteConnection.checkConnectionsConsistency())
      .result;
    const isConn = (
      await this.sqliteConnection.isConnection(this.db_name, false)
    ).result;

    if (retCC && isConn) {
      db = await this.sqliteConnection.retrieveConnection(this.db_name, false);
    } else {
      db = await this.sqliteConnection.createConnection(
        this.db_name,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await db.open();
    return db;
  }

  private async ensureTablesExist(db: SQLiteDBConnection): Promise<void> {
    try {
      if (db !== null) {
        //await this._db.open();
        //await this._db.execute(`PRAGMA journal_mode=WAL;`, false);
        await db.execute(
          `CREATE TABLE IF NOT EXISTS ${this.cache_table}(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, cacheKey TEXT, expiresOn TEXT, data TEXT);`
        );
        console.log(`$$$ ensureTablesExist successful`);
      } else {
        console.log(`database.service ensureTablesExist Error: _db is null`);
      }
    } catch (err) {
      console.log(
        `database.service ensureTablesExist Error: ${JSON.stringify(err)}`
      );
    }
  }

  public async get(key: string): Promise<string> {
    try {
      const db = await this.getConnection();

      let ret = await db?.query(
        `SELECT * FROM ${this.cache_table} WHERE cacheKey = ?;`,
        [key]
      );
      if (ret && ret.values && ret.values.length > 0) {
        const now = new Date();
        if (new Date(ret.values[0].expiresOn) > now && ret.values[0].data) {
          //console.log(`cache get data: ${ret.values[0].data}`);
          return ret.values[0].data;
        } else {
          await this.delete(key);
          return '';
        }
      } else {
        return '';
      }
    } catch (err) {
      console.log(`cache.service get Error: ${JSON.stringify(err)}`);

      //return Promise.reject(new Error('Error getting cache item from db'));
      return new Promise<string>((resolve, reject) => {
        resolve('');
      });
    }
  }

  public async put(key: string, expiresOn: Date, data: string): Promise<void> {
    try {
      const db = await this.getConnection();

      let sqlcmd: string = `INSERT INTO ${this.cache_table} (cacheKey,expiresOn,data) VALUES (?,?,?)`;
      let values: Array<any> = [key, expiresOn, data];
      let ret = await db.run(sqlcmd, values);

      if (!ret?.changes?.lastId) {
        return Promise.reject(new Error('Insert cache item failed'));
      }
    } catch (err) {
      console.log(`cache.service put Error: ${JSON.stringify(err)}`);

      //return Promise.reject(new Error('Error putting item in cache db'));
      return new Promise<void>((resolve, reject) => {
        resolve();
      });
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      const db = await this.getConnection();

      let res = await db?.execute(
        `DELETE FROM ${this.cache_table} WHERE cacheKey = '${key}';`
      );
    } catch (err) {
      console.log(`cache.service delete Error: ${JSON.stringify(err)}`);
    }
  }

  public async deleteAllCache(): Promise<void> {
    try {
      const db = await this.getConnection();

      let res = await db?.execute(`DELETE FROM ${this.cache_table};`);
    } catch (err) {
      console.log(`cache.service deleteAllCache Error: ${JSON.stringify(err)}`);
    }
  }
}
