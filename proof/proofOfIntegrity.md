# Proof of Ledger Integrity

## Experiment 1 — Normal Sync
VM-A and VM-B block hashes matched for all tested blocks.

## Experiment 2 — Tampering Attempt
Deleted `vmA/gethdata/geth/chaindata` partially.
→ VM-A failed to sync; auto-re-synced from VM-B.
→ Immutability preserved: altered data rejected.
