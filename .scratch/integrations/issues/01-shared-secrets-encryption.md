# 01: Shared secrets encryption

**What to build:** Un'unica implementazione di cifratura condivisa tra il Credential store delle automazioni e le future integrazioni. La chiave viene letta da `SECRETS_ENCRYPTION_KEY`, con fallback a `AUTOMATION_CREDENTIALS_KEY` per le righe esistenti. Il formato evolvibile diventa `enc:v1:<keyId>:<base64Payload>`; le righe `Credential` senza `<keyId>` restano leggibili tramite path legacy.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Encrypt/decrypt round-trips correctly with the new encryption key.
- [x] Encrypted output follows the format `enc:v1:<keyId>:<base64Payload>` and carries enough metadata to select the right key.
- [x] Rows encrypted with the old key still decrypt when only `AUTOMATION_CREDENTIALS_KEY` is set.
- [x] `SECRETS_ENCRYPTION_KEY` takes precedence when both variables are set and the row was encrypted with it.
- [x] A missing key fails loudly and names the expected environment variable.
- [x] Existing automation imports keep working without behavioural change.
- [x] The versioned `enc:v1:` family is preserved for compatibility.
- [x] Integration decryption fails explicitly on invalid/missing prefix or corrupted tag; it never returns the ciphertext as plaintext.
- [x] `SECRETS_ENCRYPTION_KEY` is documented as a random 32+ byte value, not a human passphrase.
- [x] Tests cover round-trip, legacy-key compatibility, key selection by `keyId`, missing-key failure, and explicit failure on malformed Integration ciphertext.
