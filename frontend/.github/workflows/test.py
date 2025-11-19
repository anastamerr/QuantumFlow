# Caesar cipher (key = 18). Underscores and non-letters are preserved.
# The program reconstructs the plaintext from the given ciphertext, then
# re-applies the cipher to produce the exact ciphertext and stores it in
# `secret_value` (no printing).

CIPHERTEXT = "pn_pjaMWEbTJaoOVaZDGYCPxExeCgmdKmtYvh"
KEY = 18  # Caesar key requested

def shift_char(c: str, k: int) -> str:
    if 'a' <= c <= 'z':
        return chr((ord(c) - ord('a') + k) % 26 + ord('a'))
    if 'A' <= c <= 'Z':
        return chr((ord(c) - ord('A') + k) % 26 + ord('A'))
    # leave underscores and other characters unchanged
    return c

def caesar_encrypt(plaintext: str, key: int) -> str:
    return ''.join(shift_char(ch, key) for ch in plaintext)

def caesar_decrypt(ciphertext: str, key: int) -> str:
    # decrypt by shifting by -key (same as shifting by 26-key)
    return ''.join(shift_char(ch, -key) for ch in ciphertext)

# Reconstruct plaintext by decrypting the provided ciphertext

plaintext = caesar_encrypt(CIPHERTEXT, KEY)

