#!/usr/bin/env python3
"""Structural sanity audits mirroring the verifier's c11 checks:
tag balance (HTML outside <script>/<style> only), getElementById id presence,
script tag count, storage references, no eval/document.write.
Run: python3 tests/audit-structure.py
"""
import re
import sys

src = open('geobas-portal.html', encoding='utf-8').read()

print('script open tags (any attrs):', len(re.findall(r'<script\b', src)))
print('window.storage refs:', len(re.findall(r'window\.storage', src)))
print('localStorage refs:', len(re.findall(r'localStorage', src)))

# tag balance over HTML only (strip script + style bodies)
html = re.sub(r'<(script|style)\b[^>]*>[\s\S]*?</\1>', '', src)

VOID = {'meta','br','img','input','hr','link','source','area','base','col','embed','wbr'}
stack, errors = [], 0
tag_re = re.compile(r'<(/)?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|\'[^\']*\'|[^>"\'])*?)(/?)>')
for m in tag_re.finditer(html):
    close, tag, attrs, selfclose = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
    if tag in VOID or selfclose:
        continue
    if close:
        if stack and stack[-1] == tag:
            stack.pop()
        elif tag in ('html', 'body', 'head', 'tbody') and stack:
            # implicit close: drop until match if present, else ignore
            if tag in stack:
                while stack and stack[-1] != tag:
                    stack.pop()
                stack.pop()
            # else: stray close, ignore
        else:
            errors += 1
    else:
        stack.append(tag)
print('tag balance errors (HTML only):', errors, '| unclosed at EOF:', stack)

ids_used = set(re.findall(r"getElementById\('([^']+)'\)", src))
ids_markup = set(re.findall(r'id="([^"]+)"', src))
missing = sorted(ids_used - ids_markup)
print('getElementById ids missing from markup:', missing if missing else 'none')

print('eval/new Function/document.write refs:', len(re.findall(r'\beval\(|new Function|document\.write', src)))

fail = errors > 0 or bool(missing)
print('RESULT:', 'FAIL' if fail else 'PASS')
sys.exit(1 if fail else 0)
