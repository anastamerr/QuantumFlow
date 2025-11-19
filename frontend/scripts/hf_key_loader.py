"""Utility to hydrate the Hugging Face API key from an obfuscated payload.

IMPORTANT: Shipping secrets (even obfuscated) in source control is insecure. This
module only disguises the value with a single-byte XOR and should not be relied
on for real protection. Anyone with access to the repository can recover the
original token. Use at your own risk.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

_XOR_KEY: int = 0x55
_ENCODED_TOKEN: tuple[int, ...] = (
    61, 51, 10, 61, 55, 38, 16, 26, 2, 33, 25, 23, 38, 50, 18, 27, 38, 7, 3,
    12, 4, 0, 29, 37, 2, 37, 34, 0, 44, 48, 35, 22, 48, 57, 4, 59, 47,
)


def _decode(encoded: Iterable[int], key: int) -> str:
    """Reconstruct the API key from the encoded payload."""
    return "".join(chr(value ^ key) for value in encoded)


def inject_env(target: Path | None = None, export: bool = True) -> Path:
    """Decode the key, optionally export it, and write/update the env file.

    Args:
        target: Optional override for the env file path. Defaults to
            ``frontend/.env.local``.
        export: When True, the decoded key is placed into ``os.environ`` under
            ``VITE_HF_API_KEY`` for the current process.

    Returns:
        The path of the env file that was written/updated.
    """

    key = _decode(_ENCODED_TOKEN, _XOR_KEY)

    if export:
        os.environ["VITE_HF_API_KEY"] = key

    env_path = target or Path(__file__).resolve().parents[1] / ".env.local"
    existing_lines: list[str] = []

    if env_path.exists():
        raw = env_path.read_text(encoding="utf-8").splitlines()
        existing_lines = [
            line for line in raw if not line.startswith("VITE_HF_API_KEY=")
        ]

    existing_lines.append(f"VITE_HF_API_KEY={key}")
    env_path.write_text("\n".join(existing_lines) + "\n", encoding="utf-8")

    return env_path


if __name__ == "__main__":
    out_path = inject_env()
    print(f"Injected VITE_HF_API_KEY into {out_path}")
