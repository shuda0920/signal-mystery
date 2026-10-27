"""Search the local bilingual catalog or refresh entries from Kenney's preview page."""
import argparse
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import quote, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://kenney.nl/data/itch/preview/'
CATEGORIES = ('2D', '3D', 'Audio', 'Icons', 'Other', 'UI')


class Packages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if tag != 'a' or 'package' not in classes:
            return
        category = next((c for c in classes if c in CATEGORIES), None)
        name, href = attrs.get('id'), attrs.get('href')
        if not category or not name or not href:
            raise ValueError('Unexpected package markup; inspect the live page.')
        url = urljoin(SOURCE, href)
        if urlparse(url).netloc != 'kenney.nl':
            raise ValueError('Unexpected preview host.')
        self.rows.append({'name_en': name, 'category': category,
                          'preview_url': quote(url, safe=':/%')})


def load():
    return json.loads((ROOT / 'references/catalog.json').read_text(encoding='utf-8'))


def write_catalog(data):
    ref = ROOT / 'references'
    ref.mkdir(parents=True, exist_ok=True)
    (ref / 'catalog.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    counts = Counter(p['category'] for p in data['packages'])
    lines = ['# Kenney 素材包中英對照表', '',
             f"來源：[{SOURCE}]({SOURCE})", '',
             f"擷取日期：{data['retrieved_at']}。本頁列出 {len(data['packages'])} 包。", '',
             '英文名稱、分類與預覽連結取自原目錄；繁中為整理譯名，說明為依名稱與分類推定的用途摘要，未逐包驗證內容、格式與尺寸。', '',
             '原站提醒可能有未顯示的素材包，因此本表不是 Kenney 全站總目錄。預覽連結是展示圖，正式檔案請到 [Kenney Assets](https://kenney.nl/assets) 查找；[All-in-1 合集](https://kenney.itch.io/kenney-game-assets) 為整包下載入口。', '',
             '| 類別 | 素材包數 |', '|---|---:|']
    lines += [f'| {c} | {counts[c]} |' for c in CATEGORIES]
    for category in CATEGORIES:
        lines += ['', f'## {category}（{counts[category]} 包）', '',
                  '| 英文名稱（點擊預覽） | 繁體中文 | 說明／選材用途 |', '|---|---|---|']
        for p in data['packages']:
            if p['category'] == category:
                cells = [p['name_en'], p['name_zh_tw'], p['description_zh_tw']]
                cells = [c.replace('|', '\\|').replace('\n', ' ') for c in cells]
                lines.append(f'| [{cells[0]}]({p["preview_url"]}) | {cells[1]} | {cells[2]} |')
    (ref / 'catalog.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def refresh(old):
    request = Request(SOURCE, headers={'User-Agent': 'KenneyProjectCatalog/1.0'})
    with urlopen(request, timeout=30) as response:
        html = response.read().decode('utf-8')
    parser = Packages()
    parser.feed(html)
    if not parser.rows or len({r['name_en'] for r in parser.rows}) != len(parser.rows):
        raise ValueError('Empty or duplicate package index; existing files were retained.')
    previous = {p['name_en']: p for p in old['packages']}
    for row in parser.rows:
        known = previous.get(row['name_en'], {})
        row['name_zh_tw'] = known.get('name_zh_tw', '待翻譯')
        row['description_zh_tw'] = known.get('description_zh_tw', '新增項目，請核對預覽後補充用途。')
    return {'source_url': SOURCE, 'retrieved_at': datetime.now(timezone.utc).isoformat(),
            'description_basis': '名稱及原站分類推定，未逐包驗證規格', 'packages': parser.rows}


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--query', default='', help='Space-separated OR keywords, English or Traditional Chinese')
    parser.add_argument('--category', choices=CATEGORIES)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    data = load()
    if args.refresh:
        try:
            data = refresh(data)
            write_catalog(data)
        except Exception as error:
            print(f'Refresh failed: {error}', file=sys.stderr)
            return 1
    words = args.query.casefold().split()
    matches = [p for p in data['packages']
               if (not args.category or p['category'] == args.category)
               and (not words or any(w in ' '.join((p['name_en'], p['name_zh_tw'], p['description_zh_tw'])).casefold() for w in words))]
    print(json.dumps({'source_url': data['source_url'], 'retrieved_at': data['retrieved_at'],
                      'total': len(data['packages']), 'matched': len(matches), 'packages': matches}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
