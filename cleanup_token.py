"""
Simple script to remove the invalid token.json file
"""
import os
from pathlib import Path

token_path = Path('token.json')

if token_path.exists():
    token_path.unlink()  # Remove the file
    print(f"Removed {token_path}")
else:
    print(f"{token_path} does not exist")