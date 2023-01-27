import { Injectable } from '@angular/core';
import {
	CapacitorSQLite,
	SQLiteConnection,
	SQLiteDBConnection,
} from '@capacitor-community/sqlite';

@Injectable({
	providedIn: 'root',
})
export class CacheProvider {
	private isInitialized: boolean = false;
	private isWeb: boolean = false;
	private readonly sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
	private _db: SQLiteDBConnection | null = null;

	private readonly db_name = 'rgbbcache';
	private readonly cache_table = 'cache';

	constructor() {}

	public async initialize() {
		console.log(`initializing the cache provider`);

		if (!this.isInitialized) {
			if (this.isWeb) {
				if (!document.querySelector(this.db_name)) {
					const sqlitedb = document.createElement(this.db_name);
					document.body.appendChild(sqlitedb);
					await customElements.whenDefined(this.db_name);
				}

				await this.sqlite.initWebStore();
				this.isInitialized = true;
			}
			
			try {

				const ret = await this.sqlite.checkConnectionsConsistency();
				const isConn = (await this.sqlite.isConnection(this.db_name, false)).result;
			
				if (ret.result && isConn) {
					this._db = await this.sqlite.retrieveConnection(this.db_name, false);
				} else {
					this._db = await this.sqlite.createConnection(this.db_name, false, "no-encryption", 1, false);
				}

				if (this._db === null) {
					console.log(`database.service initialize Error: _db is null`);
				}

				await this._db.open();
				console.log(`$$$ initialize createConnection successful`);

				await this.ensureTablesExist();
				console.log(`$$$ initialize successful`);
				this.isInitialized = true;
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

	private async ensureTablesExist(): Promise<void> {
		try {
			if (this._db !== null) {
				//await this._db.open();
				//await this._db.execute(`PRAGMA journal_mode=WAL;`, false);
				await this._db.execute(
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

	public async get(key: string): Promise<string | null> {
		try {
			await this.initialize();

			let ret = await this._db?.query(`SELECT * FROM ${this.cache_table} WHERE cacheKey = ?;`, [key]);
			if (ret && ret.values && ret.values.length > 0) {
				const now = new Date();
				if (new Date(ret.values[0].expiresOn) > now && ret.values[0].data) {
					//console.log(`cache get data: ${ret.values[0].data}`);
					return ret.values[0].data;
				} else {
					await this.delete(key);
					return null;
				}
			} else {
				return Promise.reject(new Error('Error getting cache item from db'));
			}
		} catch (err) {
			console.log(`cache.service get Error: ${JSON.stringify(err)}`);

			//return Promise.reject(new Error('Error getting cache item from db'));
			return null;
		}
	}

	public async put(key: string, expiresOn: Date, data: string): Promise<void> {
		try {
			await this.initialize();

			let sqlcmd: string = `INSERT INTO ${this.cache_table} (cacheKey,expiresOn,data) VALUES (?,?,?)`;
			let values: Array<any> = [key, expiresOn, data];
			let ret = await this._db?.run(sqlcmd, values);

			if (!ret?.changes?.lastId) {
				return Promise.reject(new Error('Insert cache item failed'));
			}
		} catch (err) {
			console.log(`cache.service put Error: ${JSON.stringify(err)}`);

			//return Promise.reject(new Error('Error putting item in cache db'));
			return;
		}
	}

	public async delete(key: string): Promise<void> {
		try {
			await this.initialize();

			let res = await this._db?.execute(
				`DELETE FROM ${this.cache_table} WHERE cacheKey = '${key}';`
			);
		} catch (err) {
			console.log(
				`cache.service delete Error: ${JSON.stringify(err)}`
			);
		}
	}

	public async deleteAllCache(): Promise<void> {
		try {
			await this.initialize();

			let res = await this._db?.execute(
				`DELETE FROM ${this.cache_table};`
			);
		} catch (err) {
			console.log(
				`cache.service deleteAllCache Error: ${JSON.stringify(err)}`
			);
		}
	}
}
