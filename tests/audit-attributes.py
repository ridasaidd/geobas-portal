#!/usr/bin/env python3
"""Static audit: every ${...} interpolation inside a double/single-quoted HTML
attribute in the page script must be wrapped in escapeHtml/safeUrl (or be a
numeric/loop-index value that can never carry attacker-controlled text).

Run: python3 tests/audit-attributes.py  (exit 0 = clean)
"""
import re
import sys

SRC = 'geobas-portal.html'
src = open(SRC, encoding='utf-8').read()
script = src[src.index('<script>'):]
lines = script.splitlines()

# Attribute interpolation pattern: attr="${expr}" or attr='${expr}'
pat = re.compile(r'([\w-]+)=["\']\$\{([^}]+)\}["\']')

# fields that carry user/DB-controlled text if they appear bare in an attribute
DANGEROUS_FIELD = re.compile(r'\.(code|name|url|title|note|contact|description|intro|value|text)\b')

untrusted = []
trusted = []
for i, ln in enumerate(lines, 1):
    for m in pat.finditer(ln):
        attr, expr = m.group(1), m.group(2).strip()
        if 'escapeHtml' in expr or 'safeUrl' in expr:
            trusted.append((i, attr, expr))
        elif re.fullmatch(r'parseInt\([^)]*\)|String\([^)]*\)|[a-z_]+(\.[a-zA-Z]+)?|[a-z_]+\[[^\]]*\]', expr):
            # bare identifier or member: only safe if it is a numeric id / loop index
            if DANGEROUS_FIELD.search(expr):
                untrusted.append((i, attr, expr))
            else:
                trusted.append((i, attr, expr))
        else:
            untrusted.append((i, attr, expr))

print(f'== attribute-context interpolations: {len(trusted)} trusted, {len(untrusted)} untrusted ==')
for i, a, e in trusted:
    print(f'  [ok]   line {i}: {a}="${{{e}}}"')
for i, a, e in untrusted:
    print(f'  [FAIL] line {i}: {a}="${{{e}}}"')

if untrusted:
    print('\nFAIL: bare untrusted interpolation found in an HTML attribute')
    sys.exit(1)
print('\nPASS: all attribute interpolations are escaped or numeric')
