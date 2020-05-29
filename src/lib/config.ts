import { Roster } from "@c4dt/cothority/network/proto";

import toml from "toml";

type ID = Buffer;

export class Config {
    static fromTOML(raw: string): Config {
        const parsed = toml.parse(raw);

        const tryToGetField = <T>(name: string, func: (_: string) => T): T | undefined => {
            if (!(name in parsed)) {
                return undefined;
            }
            return func(parsed[name]);
        };

        const getField = <T>(name: string, func: (_: string) => T): T => {
            if (!(name in parsed)) {
                throw Error(`field "${name}" not found in config`);
            }
            return func(parsed[name]);
        };

        const asID = (field: any): ID => {
            if (typeof field !== "string") {
                throw Error("is not a string");
            }
            if (!(/[a-f0-9]{64}/).test(field)) {
                throw Error("is not of correct format");
            }

            return Buffer.from(field, "hex");
        };

        return new Config(
            getField("ByzCoinID", asID),
            Roster.fromTOML(raw),
            tryToGetField("AdminDarcID", asID),
            tryToGetField("Ephemeral", asID),
        );
    }
    
    static dedis_config = `
ByzCoinID = "9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3"
LTSID = "fd3a13fc870b829bcd3186d2a7e3f330832425fb0e977aaa141fbc526f470cc7"

[[servers]]
  Address = "tls://conode.c4dt.org:7770"
  Url = "https://conode.c4dt.org"
  Suite = "Ed25519"
  Public = "67e30e168f83c4d4614e277cefba42dbc1fb5886b3945364ea5dae3f4e4fbc0d"
  Description = "C4DT Conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6bb65e6c3fb7cb9d84c81a21ce4cedf70539452e3e220c0383f087832bbd1d588590eb4fe777a360c3e12b8020a424db20fc00deafb1212bf8a4f70b978adbae093efc9aadff0a97cb0199372d5b55f135793393d94028cac0f432fb144b269f12162dbc163a80e32bea7219c2c51700ae8de5bd849d6d4001dfb2a3a8e2a161"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "70a1f68fee1a78e621e023ea9ab0eaa042c1fa72e5bc2abd8ed9c039ce9dbdce122306f8b9e3d423757084fc9b4043adcf7b91f04c6fb66577a98f24bcddc248636fe63a69f661cd7e668fc4fa63fc2b55316c9d108d864e6f5461e31b77e03b0bcd6fcfb60b60c8a19ff07e068c43e7b3abad35ffb297710680fb693f5eee72"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://conode.c4dt.org:7780"
  Suite = "Ed25519"
  Public = "8592a0dc194d1ba035693d922dd1e5076c89c28275143de80ea4e9640b4df6ea"
  Description = "2nd C4DT conode"
  URL = "https://conode.c4dt.org:7781"
  [Services]
    [Services.ByzCoin]
      Public = "7e133eaa68d4df3af42d07fe23cc2c96c25c5508f6cb1aafd5dfa5a4da4c2a420eff2942b2cf94368d3a8c92156dd5920ba0dcc0d41588db623f6d94874051e565449e7de3598ac93c3bb286e8b11154a46dc4ae67d359838c1a3b4a331b85c10353d56889506cff201f33d489d8ff635b9574f07e24ecb7d0ce8fd12135065b"
      Suite = "bn256.adapter"
    [Services.Skipchain]
      Public = "2baeb3ff4824177e50f203337e6ef32907c0e61b3a6357351cc0a64ad1b38129891455bcdaeff16b10cf1179605b4cbc356adc05164a7ce9511edfc8b8b0ea5787098900ccd14f119f574da1a0f5c639706c3c780e9d985d4893088c33df1eb15a668207b2e6195cd26be21516fd43474a5e0dd087574e24bcbc1c8f4ee98f4b"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://gasser.blue:7770"
  Url = "https://gasser.blue:7771"
  Suite = "Ed25519"
  Public = "0e4c620122daca9518cace2a6b11c5c0892fbde7b130d04e8a194fd02906ffc6"
  Description = "Ineiti's conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "00fe956fe1b90332bd7c5182d9f125c0e2108f5178d71b42b5f02582f9f2814281d4f2e0c9bd25f711c7138f9c2fb5fb6578b65aeae8cff1c349df34c497882f86ba36037678275d086b57bd04a9a020a80a47242b08274c696c009f097d3e7a31d0a6fc2b2e01b9d005e8c2ea538f3c581baac918cacb0650f6b3c2082e549f"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "5878c63855bf0ad9a2575865b18a8e5856ed6c6b1cbfe1bacc0f4e889b9cd79f78b024fdcef448be2ffb292622927595047227f45a361e9094d5bb3ebcfd9bdb60bf179d5c6c3319d4c8bf2e1e149b78c1056814ac581b7c97decd9c58a570d6018712143844e5fd0a31ddb61e2d81bc1f35bfc47e8a884683d9692529119240"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://conode.dedis.ch:7000"
  Url = "https://conode.dedis.ch"
  Suite = "Ed25519"
  Public = "ec5c65a3c922d1df32075640e3de606197be24af76059a2ef145501122884bd3"
  Description = "EPFL Cothority-server"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6f69dc10dbef8f4d80072aa9d1bee191b0f68b137a9d06d006c39fe6667738fa2d3439caf428a1dcb6f4a5bd2ce6ff6f1462ebb1b7374080d95310bc6e1115e105d7ae38f9fed1585094b0cb13dc3a0f3e74daeaa794ca10058e44ef339055510f4d12a7234779f8db2e093dd8a14a03440a7d5a8ef04cac8fd735f20440b589"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "32ba0cccec06ac4259b39102dcba13677eb385e0fdce99c93406542c5cbed3ec6ac71a81b01207451346402542923449ecf71fc0d69b1d019df34407b532fb2a09005c801e359afb377cc3255e918a096912bf6f7b7e4040532404996e05f78c408760b57fcf9e04c50eb7bc413438aca9d653dd0b6a8353d128370ebd4bdb10"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://dedis.nella.org:7770"
  Url = "https://dedis.nella.org:7771"
  Suite = "Ed25519"
  Public = "ad91a87dd89d31e4fc77ee04f1fc684bb6697bcef96720b84422437ff00b79e3"
  Description = "dedis.nella.org"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "7a989c19ef64ac45d4962fa0e60184c0adaf90082f5ea572de2d241d11ac8e6a53f968928d80a910ed7d883c05d74cf3e3c2c9096dd9fb5b64a03f9e552700388effcd3106e58f4bb99c384afb4b6b2530bfee6fdfb6b4f41a383b2ad31bf03c18d3f43a4a8bacbe5da16c3851c3c8be3607af1bb19b085861d71cd92c8b8406"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "78dd1cfd6e70ad9cf5afb8263811fabe95aedee835567cc5ca7773a6787a03736ee24accb8e00370768aab14dab949584054e255c626d0141182454f8c77794a4e8c69a4dc6082f30f1cf33de45daea63fc52c4a91ed79ca88e4f6d363a46d87017b038da5ca4656f610d77fd91e1aae320d7d399ca7fdf41f5348b63712310f"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://fairywren.ch:7770"
  Url = "https://fairywren.ch:7771"
  Suite = "Ed25519"
  Public = "0bcdaebde16f50fb65b717a0501e7ede020045286d6ece10fdea1bdd8f37af39"
  Description = "Gaylor's Conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "2754e502579e77f92322458022f6b97ff18471f2e7523028ea6dab720da11ab189f98ef9a0308c7aa656f3339baded992248def25e3e2e1428c1601809579b934bb2aaf66b3d8a68712f68d744661d270278ebcf434204af961c729db6db85a54930dfe6b75184647d0e81138db2a87ccaeccff3500be2bf409827eef5ec150d"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "69088f9df0396cfd296eeeb060bc84d807f3f2cf3b02b8eafd953f30e9e979a203fd11035e9f1fca2662383841c3c630ee3554150ec2b5fdb50819a22a2682dd341f0424fec4eafb8a17041b939ef18eabdd8c38e2f057619a541c506bbae5755265ae6b9156690b7a2907ca0ec6394d79363d5492aa2c9512e3fba882aad358"
      Suite = "bn256.adapter"
`;

    private constructor(
        readonly byzCoinID: ID,
        readonly roster: Roster,
        // TODO used only when registering, better provide them via URL during
        // initial deploy; that's also why it's optional
        readonly adminDarcID?: ID,
        readonly ephemeral?: ID,
    ) {}
}
