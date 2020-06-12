import {SkipBlock} from '@dedis/cothority/skipchain';
import {DataBody, DataHeader} from '@dedis/cothority/byzcoin/proto';
import ClientTransaction, {Argument, Instruction} from '@dedis/cothority/byzcoin/client-transaction';
import {CredentialStructBS} from '@c4dt/dynacred';
import {ChainConfig, Instance, Proof} from '@dedis/cothority/byzcoin';
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    DarcInstance
} from '@dedis/cothority/byzcoin/contracts';
import {Darc, Rule} from '@dedis/cothority/darc';
import {CalypsoReadInstance, CalypsoWriteInstance, Read, Write} from '@dedis/cothority/calypso';
import ValueInstance from '@dedis/cothority/byzcoin/contracts/value-instance';
import {BehaviorSubject} from 'rxjs';
import {AddressBook} from '@c4dt/dynacred';
import {ByzCoinService} from "src/lib/byz-coin.service";

export class PrettyPrint implements PrettyPrinter {
    constructor(public title: string, public sm: StringMap) {
    }

    join(indentStr = '  '): string {
        const indent = (d: StringMap): string[] => {
            const str: string[] = [];
            Object.keys(d).forEach((k) => {
                let title = k;
                const entry = d[k];
                let sub: string[] = [];
                if (entry instanceof Array) {
                    sub = entry;
                } else if (typeof entry === 'string') {
                    title += `: ${entry}`;
                } else if (Buffer.isBuffer(entry)) {
                    title += `: ${entry.toString('hex')}`;
                } else {
                    sub = indent(entry);
                }
                str.push(title, ...sub.map((s) => `${indentStr}${s}`));
            });
            return str;
        };
        return indent(this.sm).join('\n');
    }

    addTo(sm: StringMap) {
        sm[this.title] = this.sm;
    }
}

export class PrettyPrintElement extends PrettyPrint {

    static clientTransaction(ctx: ClientTransaction): PrettyPrint {
        const sm: StringMap = {};
        ctx.instructions.forEach((inst, i) => {
            const smi: StringMap = {};
            smi[`Target InstanceID`] = `${inst.instanceID.toString('hex')}`;
            let cid = '';
            let args: Argument[];
            let smType = '';
            switch (inst.type) {
                case Instruction.typeSpawn:
                    smType = 'spawn';
                    cid = inst.spawn.contractID;
                    args = inst.spawn.args;
                    break;
                case Instruction.typeInvoke:
                    smType = 'invoke';
                    cid = inst.invoke.contractID;
                    args = inst.invoke.args;
                    smi.Command = inst.invoke.command;
                    break;
                case Instruction.typeDelete:
                    smType = 'spawn';
                    cid = inst.spawn.contractID;
                    args = inst.spawn.args;
                    break;
            }
            smi.ContractID = cid;
            smi.Arguments = args.map((arg) => `${arg.name}: ${arg.value.toString('hex')}`);
            sm[`Instruction ${i} - ${smType.toUpperCase()}`] = smi;
        });
        return new PrettyPrint('ClientTransaction', sm);
    }

    static skipBlock(sb: SkipBlock): PrettyPrint {
        const head = DataHeader.decode(sb.data);
        const body = DataBody.decode(sb.payload);
        const txr: StringMap = {};
        body.txResults.forEach((tx, i) => {
            txr[`Transaction ${i}`] = {
                Accepted: tx.accepted.toString(),
                ...PrettyPrintElement.clientTransaction(tx.clientTransaction).sm
            }
        });
        return new PrettyPrint(`SkipBlock: #${sb.index}`,
            {
                'SkipBlock-Header': {
                    BackwardLinks: sb.backlinks.map((bl, i) => `${i}: ${bl.toString('hex')}`),
                    ForwardLinks: sb.forwardLinks.map((fl, i) => `${i}: ${fl.to.toString('hex')}`),
                    Hash: sb.hash,
                    SkipChainID: sb.genesis,
                    '(Base|Max|)Height': [sb.baseHeight.toString(), sb.maxHeight.toString(), sb.height.toString()].join(' | '),
                    Roster: sb.roster.list.map((l) => `${l.description}: ${l.address}`),
                },
                'ByzCoin-Header': {
                    Timestamp: new Date(head.timestamp.div(1e6).toNumber()).toString(),
                    Version: head.version.toString(),
                },
                'ByzCoin-Body': txr
            });
    }

    static proof(pr: Proof): PrettyPrintInstance {
        const sm: StringMap = {
            Headers: {
                Contract: pr.contractID,
                Darc: pr.darcID,
                Version: pr.stateChangeBody.version.toString()
            }
        };
        PrettyPrintInstance.switch(Instance.fromProof(pr.key, pr)).addTo(sm);
        return new PrettyPrintInstance(`Instance ID: ${pr.key.toString('hex')}`, sm);
    }
}

export class PrettyPrintInstance extends PrettyPrint {
    constructor(title: string, sm: StringMap) {
        super(title, sm);
    }

    static darc(d: Darc): PrettyPrintInstance {
        return new PrettyPrintInstance(`Darc ${d.description.toString()}`, {
            Description: d.description.toString(),
            BaseID: d.getBaseID(),
            Version: d.version.toString(),
            Rules: d.rules.list.map((r) => `  ${r.action.toUpperCase()} = ${r.getExpr()}`),
        })
    }

    static calypsoWrite(wr: Write): PrettyPrintInstance {
        const sm = {
            ExtraData: wr.extradata,
            LTSID: wr.ltsid,
        };
        if (wr.cost) {
            sm['Cost'] = wr.cost.value;
        }
        return new PrettyPrintInstance(`CalypsoWrite`, sm);
    }

    static calypsoRead(rd: Read): PrettyPrintInstance {
        return new PrettyPrintInstance('CalypsoRead', {
            CalypsoWriteID: rd.write
        });
    }

    static value(buf: Buffer): PrettyPrintInstance {
        return new PrettyPrintInstance('Value', {
            Value: buf.toString().replace(/\W/g, '.')
        })
    }

    static coin(c: Coin): PrettyPrintInstance {
        // Coin-names can be either strings or hashes. To decide if it's a string, do the following:
        // - strip all tailing \x00
        // - replace all non-ascii characters with "."
        // - if there are more "." than half of the string-length, decide it's a hash
        let name = c.name.toString().replace(/\x00*$/, '')
            .replace(/\W/g, '.');
        if ((name.match(/\./g) || []).length > name.length / 2){
            name = `0x${c.name.toString('hex')}`;
        }
        return new PrettyPrintInstance('Coin', {
            Name: name,
            Value: c.value.toString()
        });
    }

    static credStruct(credSt: CredentialStruct): PrettyPrint {
        const cred = new CredentialStructBS(undefined, undefined, new BehaviorSubject(credSt));
        const pub = cred.credPublic;
        const conf = cred.credConfig;
        return new PrettyPrint('CredentialStruct',
            {
                Public: {
                    Alias: pub.alias.getValue(),
                    Email: pub.email.getValue(),
                    CoinID: pub.coinID.getValue().toString('hex'),
                    Phone: pub.phone.getValue(),
                    URL: pub.url.getValue(),
                    Version: pub.version.getValue().toString(),
                    Contacts: pub.contacts.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: '),
                    Groups: pub.groups.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: '),
                    Actions: pub.actions.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: '),
                },
                Config: {
                    View: conf.view.getValue(),
                    SpawnerID: conf.spawnerID.getValue().toString('hex'),
                    StructVersion: conf.structVersion.getValue().toString(),
                    LTSID: conf.ltsID.getValue().toString('hex')
                },
                Devices: cred.credDevices.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`),
                Recoveries: cred.credRecoveries.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`),
                Calypso: cred.credCalypso.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`)
            })
    }

    static addressBook(ab: AddressBook): PrettyPrintElement {
        return new PrettyPrint('AddressBook', {
            Entries: ab.contacts.getValue().map((c) => c.credPublic.alias.getValue() + ' : ' + c.id.toString('hex'))
        });
    }

    static async recurseRule(bcs: ByzCoinService, r: Rule, dids: Buffer[] = []): Promise<PrettyPrint>{
        const sm: StringMap = {};
        for (const [i, id] of r.getIdentities().entries()){
            if (id.startsWith('darc:')){
                const did = Buffer.from(id.slice(5), 'hex');
                if (dids.find((d) => d.equals(did))){
                    sm[i.toString()] = 'Cycles to ' + id;
                } else {
                    dids.push(did);
                    const d = await bcs.retrieveDarcBS(did);
                    const pp = await this.recurseRule(bcs, d.getValue().rules.getRule(Darc.ruleSign),
                        dids.map((did) => did));
                    sm[i.toString() + ' ' + d.getValue().description + ' ' + id] = pp.sm;
                }
            } else {
                sm[i.toString()] = id;
            }
        }
        return new PrettyPrint('Darc', sm);
    }

    static config(cfg: ChainConfig): PrettyPrintElement {
        return new PrettyPrint('ChainConfig', {
            BlockInterval: cfg.blockInterval.div(1e6).toString() + ' ms',
            MaxBlockSize: cfg.maxBlockSize.toString() + ' bytes',
            Roster: cfg.roster.list.map((l) => `${l.description}: ${l.address}`)
        })
    }

    static switch(inst: Instance): PrettyPrintInstance {
        switch (inst.contractID) {
            case DarcInstance.contractID:
                return this.darc(Darc.decode(inst.data));
            case CalypsoWriteInstance.contractID:
                return this.calypsoWrite(Write.decode(inst.data));
            case CalypsoReadInstance.contractID:
                return this.calypsoRead(Read.decode(inst.data));
            case ValueInstance.contractID:
                return this.value(inst.data);
            case CoinInstance.contractID:
                return this.coin(Coin.decode(inst.data));
            case CredentialsInstance.contractID:
                return this.credStruct(CredentialStruct.decode(inst.data));
            case 'config':
                return this.config(ChainConfig.decode(inst.data));
            default:
                throw new Error('Don\'t know this instance');
        }
    }
}

export interface PrettyPrinter {
    join(indentStr: string): string;
}

interface StringMap {
    [key: string]: StringMap | string[] | string | Buffer;
}

interface ExplorerEntry {
    label: string;

}
