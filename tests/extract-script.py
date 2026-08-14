#!/usr/bin/env python3
"""Extract the app <script> body to /tmp/portal-script.js for node --check.
Run: python3 tests/extract-script.py && node --check /tmp/portal-script.js
"""
import re

src = open('geobas-portal.html', encoding='utf-8').read()
scripts = re.findall(r'<script>([\s\S]*?)</script>', src)
body = scripts[-1]
open('/tmp/portal-script.js', 'w', encoding='utf-8').write(body)
print('extracted', len(body), 'chars of app script')
