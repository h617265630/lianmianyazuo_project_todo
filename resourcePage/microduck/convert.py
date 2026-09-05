#!/usr/bin/env python3
import re
import os

def md_to_html(content):
    lines = content.split('\n')
    html_lines = []
    in_code = False
    code_buf = []

    for line in lines:
        if line.strip().startswith('```'):
            if not in_code:
                in_code = True
                lang = line.strip()[3:]
                code_buf.append(f'<pre><code class="language-{lang}">')
            else:
                in_code = False
                html_lines.append(''.join(code_buf) + '</code></pre>')
                code_buf = []
            continue

        if in_code:
            code_buf.append(line.replace('<', '&lt;').replace('>', '&gt;'))
            continue

        if '|' in line and line.strip().startswith('|'):
            if re.match(r'^\|[\s\-:|]+\|$', line):
                continue
            cells = [c.strip() for c in line.split('|')[1:-1]]
            html_lines.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cells) + '</tr>')
            continue

        if line.startswith('#### '):
            html_lines.append(f'<h4>{line[5:]}</h4>')
        elif line.startswith('### '):
            html_lines.append(f'<h3>{line[4:]}</h3>')
        elif line.startswith('## '):
            html_lines.append(f'<h2>{line[3:]}</h2>')
        elif line.startswith('# '):
            html_lines.append(f'<h1>{line[2:]}</h1>')
        elif line.strip() == '---':
            html_lines.append('<hr>')
        elif line.startswith('>'):
            html_lines.append(f'<blockquote>{line[1:].strip()}</blockquote>')
        elif line.startswith('- ') or line.startswith('* '):
            html_lines.append(f'<li>{line[2:]}')
        elif re.match(r'^\d+\. ', line):
            n = re.match(r'^(\d+)\. (.*)', line)
            html_lines.append(f'<li>{n.group(2)}')
        elif line.strip() == '':
            html_lines.append('')
        else:
            line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
            line = re.sub(r'\*(.*?)\*', r'<em>\1</em>', line)
            line = re.sub(r'`(.*?)`', r'<code>\1</code>', line)
            html_lines.append(f'<p>{line}</p>')

    return '\n'.join(html_lines)

base = '/Users/flower/Desktop/duck_分析'
os.chdir(base)

CSS = '''body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.8; background: #fafafa; }
h1, h2, h3, h4 { color: #1a1a2e; margin-top: 1.5em; }
h1 { border-bottom: 3px solid #ffd700; padding-bottom: 10px; }
code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre { background: #1a1a2e; color: #f0f0f0; padding: 15px; border-radius: 8px; overflow-x: auto; }
pre code { background: none; padding: 0; color: inherit; }
blockquote { border-left: 4px solid #ffd700; padding-left: 15px; color: #666; margin: 15px 0; }
table { border-collapse: collapse; width: 100%; margin: 15px 0; }
td, th { border: 1px solid #ddd; padding: 10px; text-align: left; }
th { background: #1a1a2e; color: #fff; }
tr:nth-child(even) { background: #f9f9f9; }
li { margin-left: 20px; }
hr { border: none; border-top: 1px solid #ddd; margin: 30px 0; }
.back { display: inline-block; margin-bottom: 20px; color: #888; text-decoration: none; }
.back:hover { color: #ffd700; }'''

for f in os.listdir('.'):
    if f.endswith('.md') and f != 'notes/README.md':
        with open(f, 'r') as fp:
            content = fp.read()
        html = md_to_html(content)

        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        title = title_match.group(1) if title_match else f

        html_file = f.replace('.md', '.html')
        with open(html_file, 'w') as fp:
            fp.write(f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
<a href="index.html" class="back">← 返回目录</a>
{html}
</body>
</html>''')
        print(f'Created {html_file}')
