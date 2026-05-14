/**
 * utils/ipfsHelper.js
 * Optional IPFS upload via Pinata.
 * Stub — enable by setting PINATA_API_KEY and PINATA_SECRET in .env
 */

const https = require("https");

const PINATA_ENABLED =
  process.env.PINATA_API_KEY && process.env.PINATA_SECRET;

/**
 * Upload a JSON metadata object to IPFS via Pinata.
 * @param {Object} metadata
 * @returns {Promise<string>} IPFS hash (CID)
 */
async function uploadToIPFS(metadata) {
  if (!PINATA_ENABLED) {
    console.warn("IPFS upload skipped — Pinata credentials not configured.");
    return null;
  }

  const body = JSON.stringify({
    pinataContent: metadata,
    pinataMetadata: { name: "ChainPresence-Metadata" },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.pinata.cloud",
      path: "/pinning/pinJSONToIPFS",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.IpfsHash);
        } catch {
          reject(new Error("Invalid Pinata response"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { uploadToIPFS };
