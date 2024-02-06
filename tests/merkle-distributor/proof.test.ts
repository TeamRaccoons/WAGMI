

import { BN, web3 } from "@coral-xyz/anchor";
import { sha256 } from "js-sha256";

describe("proof", () => {
    // test
    let index = 1;
    let account = new web3.PublicKey(
        "smaK3fwkA7ubbxEhsimp1iqPTzfS4MBsNL77QLABZP6"
    );
    let amount = 100;
    let buf = Buffer.concat([
        new BN(index).toArrayLike(Buffer, "le", 8),
        account.toBuffer(),
        new BN(amount).toArrayLike(Buffer, "le", 8),
    ]);

    buf = Buffer.from(sha256(buf), "hex");

    buf = Buffer.concat([
        Buffer.from([0]),
        buf
    ]);
    buf = Buffer.from(sha256(buf), "hex");

    console.log(buf);
    for (var i = 0, n = buf.length; i < n; i++) {
        console.log(buf[i].toString(10))
    }
})