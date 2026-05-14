/**
 * verifyWallet.js
 * Middleware that verifies an Ethereum signed message to authenticate requests.
 * Usage: include header  Authorization: Bearer <signature>
 *        and body field  message, address
 */

const { ethers } = require("ethers");

/**
 * Expects the client to send:
 *   Header:  Authorization: Bearer <hex-signature>
 *   Body:    { message: string, address: string }
 *
 * Attaches req.verifiedAddress if valid.
 */
function verifyWallet(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const signature = authHeader.replace("Bearer ", "").trim();
    const { message, address } = req.body;

    if (!message || !address || !signature) {
      return res.status(400).json({ error: "message, address, and signature are required" });
    }

    // Recover signer from personal_sign message
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    req.verifiedAddress = recoveredAddress;
    next();
  } catch (err) {
    console.error("verifyWallet error:", err.message);
    res.status(401).json({ error: "Invalid signature" });
  }
}

module.exports = verifyWallet;
