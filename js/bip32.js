/**
 * @class Bip32
 * @author Ignacio Miguel Rodríguez
 *
 * Class representing a BIP32 key pair for hierarchical deterministic wallets.
 *
 * This class implements the BIP32 protocol for generating and managing
 * hierarchical deterministic keys. It supports generating keys from a seed,
 * deriving child keys, and managing the private key, public key, and chain code.
 *
 * BIP32 allows for a tree-like structure of keys, where each node (key pair)
 * can have multiple child nodes. This class provides methods to derive both
 * hardened and non-hardened child keys.
 *
 * Key Features:
 * - Generate a master key pair from a seed.
 * - Derive child keys from the master key.
 * - Support for hardened and non-hardened derivation.
 * - Serialization and deserialization of keys and points.
 *
 * Note: This implementation uses the secp256k1 elliptic curve.
 */
class Bip32 {
    static HARDENED_BIT = 0x80000000;
    static N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    static THRESHOLD = 2 ** 31 - 1;
    constructor() {
        this.privateKey = BigInt(0);
        this.publicKey = BigInt(0);
        this.chain = BigInt(0);
    }

    /**
     * Gets the private key.
     * @returns {BigInt} The private key.
     */
    getPrivateKey() {
        return this.privateKey
    }

    /**
     * Gets the public key.
     * @returns {BigInt} The public key.
     */
    getPublicKey() {
        return this.publicKey
    }

    /**
     * Gets the chain code.
     * @returns {BigInt} The chain code.
     */
    getChainCode() {
        return this.chain
    }

    /**
     * Creates a Bip32 instance from a seed.
     * @param {Uint8Array} seed - The seed for generating the master key and chain code.
     * @returns {Promise<Bip32>} The Bip32 instance.
     */
    static async fromSeed(seed) {
        const instance = new Bip32();
        await instance.initializeWithSeed(seed);
        return instance;
    }

    /**
     * Creates a Bip32 instance from a private key and chain code.
     * @param {BigInt} privKey - The private key.
     * @param {BigInt} chainCode - The chain code.
     * @returns {Bip32} The Bip32 instance.
     */
    static fromPrivKey(privKey, chainCode) {
        const instance = new Bip32();
        instance.initializeWithPrivKey(privKey, chainCode);
        return instance;
    }

    /**
     * Initializes the Bip32 instance with a seed.
     * @param {Uint8Array} seed - The seed for generating the master key and chain code.
     */
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

        this.privateKey = masterKey;
        this.publicKey =  BigInt('0x' + arrayBufferToHex(this.serP(this.point(this.privateKey.toString(16)))))
        this.chain = masterChain
    }

    /**
     * Bip32 initialization based on private key and chain code.
     * @param {BigInt} privKey - The private key.
     * @param {BigInt} chainCode - The chain code.
     */
    initializeWithPrivKey(privKey, chainCode)
    {
        this.privateKey = privKey;
        this.chain = chainCode;
        this.publicKey = BigInt('0x' + arrayBufferToHex(this.serP(this.point(this.privateKey.toString(16)))))
    }

    /**
     * Computes the HMAC-SHA512 hash of the data using the provided key.
     * @param {string|Uint8Array} key - The key for HMAC.
     * @param {Uint8Array} data - The data to hash.
     * @returns {Promise<Uint8Array>} The HMAC-SHA512 hash.
     */
    async hmacSha512(key, data) {
        const encodedKey = key instanceof Uint8Array ? key : new TextEncoder().encode(key);
        const cryptoKey = await crypto.subtle.importKey('raw', encodedKey, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
        return new Uint8Array(signature);
    }

    /**
     * Computes the elliptic curve point for a given point p.
     * @param {BigInt} p - The point.
     * @returns {elliptic.curve.point} The resulting elliptic curve point.
     */
    point(p) {
        const EC = elliptic.ec;
        const ec = new EC('secp256k1');
        return ec.g.mul(p);
    }

    /**
     * Serializes a 32-bit integer to a 4-byte array.
     * @param {number} i - The integer to serialize.
     * @returns {Uint8Array} The serialized 4-byte array.
     */
    ser32(i) {
        const byteLength = 4;
        const byteArray = new Uint8Array(byteLength);
        for (let j = byteLength - 1; j >= 0; j--) {
            byteArray[j] = i & 0xff;
            i >>= 8; // Shift bits right by 8 for next byte
        }
        return byteArray;
    }

    /**
     * Serializes a 256-bit integer to a 32-byte array.
     * @param {BigInt} p - The integer to serialize.
     * @returns {ArrayBuffer} The serialized byte array.
     */
    ser256(p) {
        let hexString = p.toString(16).padStart(64, '0');
        if (hexString.length % 2 !== 0)
            hexString = '0' + hexString;
        return hexStringToArrayBuffer(hexString);
    }

    /**
     * Serializes an elliptic curve point.
     * @param {elliptic.curve.point} p - The elliptic curve point to serialize.
     * @returns {Uint8Array} The serialized point.
     */
    serP(p) { // not compressed to match kotlin's implementation
        const xCoordBytes = this.ser256(p.getX());
        const yCoordBytes = this.ser256(p.getY());
        return new Uint8Array([...xCoordBytes, ...yCoordBytes]);    }

    /**
     * Parses a 256-bit integer from a byte array.
     * @param {Uint8Array} p - The byte array to parse.
     * @returns {BigInt} The parsed 256-bit integer.
     */
    parse256(p) {
        let hexString= BigInt('0x' + Array.from(p).map(byte => byte.toString(16).padStart(2, '0')).join(''));
        if (hexString.length % 2 !== 0)
            hexString = '0' + hexString;
        return BigInt('0x' + hexString);
    }

    /**
     * Derives a child key from the current key.
     * @param {number} childNumber - The index of the child key to derive.
     * @returns {Promise<Bip32>} The derived child key.
     */
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
        let chainCode = arrayBufferToHex(chainCodeNew).padStart(64, '0');
        if (chainCode.length % 2 !== 0)
            chainCode = '0' + chainCode;
        return Bip32.fromPrivKey(privateKey, BigInt('0x' + chainCode)); // both private key and chain code as big integer
    }

    /**
     * Checks if the given index is hardened.
     * @param {number} a - The index to check.
     * @returns {boolean} True if the index is hardened, false otherwise.
     */
    isHardened(a) {
        return (a & Bip32.HARDENED_BIT) !== 0;
    }

    /**
     * Gets the private key bytes as a 33-byte array.
     * @returns {Uint8Array} The 33-byte private key array.
     */
    getPrivateKeyBytes33() {
        const numBytes = 33;
        const bytes33 = new Uint8Array(numBytes);
        const priv = this.ser256(this.privateKey);
        bytes33.set(priv, numBytes - priv.length);
        return bytes33;
    }
}
