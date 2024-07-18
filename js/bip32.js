class Bip32 {
    static HARDENED_BIT = 0x80000000;
    static N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    static THRESHOLD = 2 ** 31 - 1;
    constructor() {
        this.privateKey = BigInt(0);
        this.publicKey = BigInt(0);
        this.chain = BigInt(0);
    }

    getPrivateKey() {
        return this.privateKey
    }

    getPublicKey() {
        return this.publicKey
    }

    getChainCode() {
        return this.chain
    }
    static async fromSeed(seed) {
        const instance = new Bip32();
        await instance.initializeWithSeed(seed);
        return instance;
    }
    static fromPrivKey(privKey, chainCode) {
        const instance = new Bip32();
        instance.initializeWithPrivKey(privKey, chainCode);
        return instance;
    }

    async initializeWithSeed(seed) {
        let valid = false;
        let masterKey = BigInt(0);
        let masterChain = BigInt(0);
        while (!valid) {
            const capitalI = await this.hmacSha512("Bitcoin seed", seed);
            const left = capitalI.slice(0, 32);
            const right = capitalI.slice(32, 64);
            masterKey = this.parse256(left);
            masterChain = this.parse256(right);
            if (masterKey !== (BigInt(0)) || masterKey < BigInt(Bip32.N)) valid = true;
        }
        /*
        this.privateKey = masterKey.toString(16);
        this.publicKey = arrayBufferToHex(this.serP(this.point(this.privateKey)))
        this.chain = masterChain.toString(16);*/
        this.privateKey = masterKey;
        this.publicKey =  BigInt('0x' + arrayBufferToHex(this.serP(this.point(this.privateKey.toString(16)))))
        this.chain = masterChain
    }

    /**
     * Bip32 initialization based on private key and chain code
     * @param privKey (BigInt)
     * @param chainCode (BigInt)
     */
    initializeWithPrivKey(privKey, chainCode)
    {
        this.privateKey = privKey;
        this.chain = chainCode;
        this.publicKey = BigInt('0x' + arrayBufferToHex(this.serP(this.point(this.privateKey.toString(16)))))
    }

    async hmacSha512(key, data) {
        let encoded = key;
        if(!(key instanceof Uint8Array)) {
            const enc = new TextEncoder();
            encoded = enc.encode(key)}

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encoded,
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
        return new Uint8Array(signature);
    }

    point(p) {
        const EC = elliptic.ec;
        const ec = new EC('secp256k1');
        const basePoint = ec.g;
        return basePoint.mul(p);
    }

    ser32(i) {
        const byteLength = 4;
        const byteArray = new Uint8Array(byteLength);
        for (let j = byteLength - 1; j >= 0; j--) {
            byteArray[j] = i & 0xff;
            i >>= 8; // Shift bits right by 8 for next byte
        }
        return byteArray;
    }

    ser256(p) {
        let hexString = p.toString(16)
        if (hexString.length % 2 !== 0)
            hexString = '0' + hexString;
        return hexStringToArrayBuffer(hexString);
    }

    serP(p) { // not compressed to match kotlin's implementation
        const xCoordBytes = this.ser256(p.getX());
        const yCoordBytes = this.ser256(p.getY());
        return new Uint8Array(Array.from(xCoordBytes).concat(Array.from(yCoordBytes)));
    }

    parse256(p) {
        let hexString = '';
        for (let byte of p) {
            hexString += byte.toString(16).padStart(2, '0');
        }
        if (hexString.length % 2 !== 0)
            hexString = '0' + hexString;
        return BigInt('0x' + hexString);
    }

    async deriveChildKey(childNumber) {

        const data = new Uint8Array(37);
        let offset = 0;

        if (this.isHardened(childNumber)) {
            const privateKeyBytes = this.getPrivateKeyBytes33();
            data.set(privateKeyBytes, offset);
            offset += privateKeyBytes.length;
        } else {
            const parentPublicKey = this.point(this.privateKey)
            data.set(parentPublicKey, offset);
            offset += parentPublicKey.length;
        }
        // test if it is necessary to ser32
        data.set(this.ser32(childNumber), offset)
        let capitalI = await this.hmacSha512(hexStringToArrayBuffer(this.chain.toString(16)), data);
        const il = capitalI.slice(0, 32);
        const chainCodeNew = capitalI.slice(32, 64);

        // Securely erase sensitive data
        capitalI.fill(0);

        const ilInt =  this.parse256(il);

        // Securely erase sensitive data
        il.fill(0);

        const privateKey = (this.privateKey + ilInt) % Bip32.N;
        let chainCode = arrayBufferToHex(chainCodeNew)
        if (chainCode.length % 2 !== 0)
            chainCode = '0' + chainCode;
        return Bip32.fromPrivKey(privateKey, BigInt('0x' + chainCode)); // both private key and chain code as big integer
    }


    isHardened(a) {
        return (a & Bip32.HARDENED_BIT) !== 0;
    }

    getPrivateKeyBytes33() {
        const numBytes = 33;
        const bytes33 = new Uint8Array(numBytes);
        const priv = this.ser256(this.privateKey);
        bytes33.set(priv, numBytes - priv.length);
        return bytes33;
    }
}
