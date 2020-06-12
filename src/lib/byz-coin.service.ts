import { Injectable } from '@angular/core';
import { ByzCoinRPC, IStorage } from '@dedis/cothority/byzcoin';
import Log from '@dedis/cothority/log';
import { RosterWSConnection } from '@dedis/cothority/network';
import { SkipBlock, SkipchainRPC } from '@dedis/cothority/skipchain';
import { StatusRequest, StatusResponse } from '@dedis/cothority/status/proto';
import StatusRPC from '@dedis/cothority/status/status-rpc';
import Dexie from 'dexie';
import { Fetcher, User } from '@c4dt/dynacred';
import { Config } from './config';
import {IdentityWrapper} from '@dedis/cothority/darc';

@Injectable({
    providedIn: 'root',
})
export class ByzCoinService extends Fetcher {
    skipchain: SkipchainRPC;
    user?: User;
    config?: Config;
    conn?: RosterWSConnection;
    private readonly storageKeyLatest = 'latest_skipblock';
    // This is the hardcoded block at 54784, which has higher forward-links than 0, which is broken :(.
    // Once 0x10000 is created, this will be updated.
    private readonly idKnown = Buffer.from('6ff6ed6bfeedc6a9ce832bb128cb425295a3797e44c4bc867c79a1899d1a8120', 'hex');

    constructor() {
        // Initialize with undefined. Before using, the root component has to call `loadConfig`.
        super(undefined, undefined);
    }

    async loadConfig(logger: (msg: string, percentage: number) => void): Promise<void> {
        logger('Loading config', 0);
        this.config = Config.fromTOML(Config.dedis_config);
        logger('Pinging nodes', 10);
        this.conn = new RosterWSConnection(this.config.roster, StatusRPC.serviceName);
        this.conn.setParallel(this.config.roster.length);
        for (let i = 0; i < 3; i++) {
            await this.conn.send(new StatusRequest(), StatusResponse);
            const url = this.conn.getURL();
            logger(`Fastest node at ${i + 1}/3: ${url}`, 20 + i * 20);
        }
        this.conn.setParallel(1);
        logger('Fetching latest block', 70);
        this.db = new StorageDB();
        this.skipchain = new SkipchainRPC(this.conn);
        // @ts-ignore
        global.bcs = this;
        try {
            let latest: SkipBlock;
            const latestBuf = await this.db.get(this.storageKeyLatest);
            if (latestBuf !== undefined) {
                latest = SkipBlock.decode(latestBuf);
                Log.lvl2('Loaded latest block from db:', latest.index);
            } else {
                latest = await this.skipchain.getSkipBlock(this.idKnown);
                Log.lvl2('Got known skipblock from its hash');
            }
            this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID,
                3, 1000, latest, this.db, false);
        } catch (e) {
            logger('Getting genesis chain', 80);
            this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID,
                3, 1000, undefined, this.db, false);
        }
        Log.lvl2('storing latest block in db:', this.bc.latest.index);
        await this.db.set(this.storageKeyLatest, Buffer.from(SkipBlock.encode(this.bc.latest).finish()));
        logger('Done connecting', 100);
    }

    async hasUser(base = 'main'): Promise<boolean> {
        try {
            await this.retrieveUserKeyCredID(base);
            return true;
        } catch (e) {
            Log.warn('while checking user:', e);
        }
        return false;
    }

    async loadUser(logger: (msg: string, percentage: number) => void): Promise<void> {
        logger('Checking if user exists', 20);
        if (!(await this.hasUser())) {
            Log.warn('no user stored');
        } else {
                logger('Loading data', 80);
                this.user = await this.retrieveUserByDB();
                const signerDarc = await this.user.identityDarcSigner;
                const rules = await this.bc.checkAuthorization(this.bc.genesisID, signerDarc.id,
                    IdentityWrapper.fromIdentity(this.user.kiSigner));
                if (rules.length === 0) {
                    await this.user.clearDB();
                    throw new Error( 'Sorry, but this device has been revoked.' +
                        ' If you want to use it again, you\'ll have to re-activate it.');
                }
        }
        logger('Done', 100);
    }

    async migrate(): Promise<void> {
        return User.migrate(new StorageDBOld(), new StorageDB());
    }
}

/**
 * The main DB storage for dynacred users in the new version.
 * The only important information that is stored is the private key
 * of this device and the credentialID of the user.
 * All other data stored is purely for caching reasons to give a
 * better user-experience.
 */
export class StorageDB implements IStorage {
    db: Dexie.Table<{ key: string, buf: Buffer }, string>;

    constructor() {
        const db = new Dexie('dynasent2');
        db.version(1).stores({
            contacts: '&key',
        });
        this.db = db.table('contacts');
    }

    async set(key: string, buf: Buffer) {
        await this.db.put({key, buf});
    }

    async get(key: string): Promise<Buffer | undefined> {
        const entry = await this.db.get({key});
        if (entry !== undefined) {
            return Buffer.from(entry.buf);
        }
        return undefined;
    }
}

/**
 * This class is only for migration - it reads the data of the previous format of
 * the user account, before it is written in the new DB format.
 */
export class StorageDBOld implements IStorage {
    db: Dexie.Table<{ key: string, buffer: string }, string>;

    constructor() {
        const db = new Dexie('dynasent');
        db.version(1).stores({
            contacts: '&key, buffer',
        });
        this.db = db.table('contacts');
    }

    async set(key: string, buf: Buffer) {
        await this.db.put({key, buffer: buf.toString()});
    }

    async get(key: string): Promise<Buffer | undefined> {
        const entry = await this.db.get({key});
        if (entry !== undefined) {
            return Buffer.from(entry.buffer);
        }
        return undefined;
    }
}
