import argparse
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

TEXT_SUFFIXES = {'.php', '.js', '.py', '.sh', '.json', '.xml', '.yml', '.yaml', '.md', '.txt', '.gitignore'}
SKIP_DIRS = {'.git', '__pycache__'}
RUNTIME_FORBIDDEN = re.compile(r'https?://|WebSocket|EventSource|sendBeacon|axios|\.ajax\s*\(', re.I)
SOURCE_COMMENT = re.compile(r'^\s*(?://|/\*|\*)')
PY_COMMENT = re.compile(r'^\s*#(?!\!)')


def fail(message):
    raise SystemExit(message)


def read_text(path):
    try:
        return path.read_text(encoding='utf-8')
    except UnicodeDecodeError as exc:
        fail(f'UTF-8 olmayan metin dosyası: {path}: {exc}')


def is_text(path):
    if path.suffix.lower() in TEXT_SUFFIXES:
        return True
    if path.name == '.gitignore':
        return True
    if '/source/' in '/' + path.as_posix() + '/' or path.as_posix().startswith('source/'):
        return True
    return False


def parse_xml(path):
    try:
        return ET.parse(path)
    except ET.ParseError as exc:
        fail(f'XML geçersiz: {path}: {exc}')


def parse_json(path):
    try:
        return json.loads(read_text(path))
    except json.JSONDecodeError as exc:
        fail(f'JSON geçersiz: {path}: {exc}')


def check_comments(path, text):
    suffix = path.suffix.lower()
    for number, line in enumerate(text.splitlines(), 1):
        if suffix in {'.js', '.php'} or path.parent.name in {'dictionary', 'editor'}:
            if SOURCE_COMMENT.match(line):
                fail(f'Kod yorum satırı bulundu: {path}:{number}')
        if suffix == '.py' and PY_COMMENT.match(line):
            fail(f'Python yorum satırı bulundu: {path}:{number}')


def check_routes(root, data_root):
    routes = parse_xml(data_root / 'routes.xml').getroot()
    for route in routes.findall('route'):
        controller = route.attrib.get('controller', '')
        route_type = route.attrib.get('route_type', '')
        if ':' not in controller:
            fail(f'Geçersiz controller rotası: {controller}')
        addon, name = controller.split(':', 1)
        if addon != 'Warext\\TurkishSpellCheck' or not name:
            fail(f'Beklenmeyen controller rotası: {controller}')
        area = 'Admin' if route_type == 'admin' else 'Pub'
        path = root / 'upload/src/addons/Warext/TurkishSpellCheck' / area / 'Controller' / f'{name}.php'
        if not path.is_file():
            fail(f'Route controller dosyası eksik: {path}')


def check_options(data_root):
    options_root = parse_xml(data_root / 'options.xml').getroot()
    phrases_root = parse_xml(data_root / 'phrases.xml').getroot()
    phrase_titles = {node.attrib.get('title', '') for node in phrases_root.findall('phrase')}
    option_ids = []
    for option in options_root.findall('option'):
        option_id = option.attrib.get('option_id', '')
        if not option_id:
            fail('Boş option_id bulundu')
        option_ids.append(option_id)
        if f'option_{option_id}' not in phrase_titles:
            fail(f'Option başlık phrase eksik: option_{option_id}')
        if f'option_{option_id}_explain' not in phrase_titles:
            fail(f'Option açıklama phrase eksik: option_{option_id}_explain')
    return set(option_ids), phrase_titles


def check_templates(root, data_root, option_ids):
    template_mods = read_text(data_root / 'template_modifications.xml')
    referenced = set(re.findall(r'\$xf\.options\.([A-Za-z0-9_]+)', template_mods))
    missing = sorted(referenced - option_ids)
    if missing:
        fail('Template içinde tanımsız option bulundu: ' + ', '.join(missing))
    if "link('warext-spell-feedback')" not in template_mods:
        fail('Geri bildirim route bağlantısı template içinde eksik')
    bootstrap = root / 'upload/js/warext/turkish-spellcheck/bootstrap-v110.js'
    if not bootstrap.is_file():
        fail('Bootstrap dosyası eksik')


def check_bootstrap(root):
    runtime = root / 'upload/js/warext/turkish-spellcheck'
    bootstrap_path = runtime / 'bootstrap-v110.js'
    bootstrap = read_text(bootstrap_path)
    if "const VERSION = '1.0.0';" not in bootstrap:
        fail('Bootstrap V1 sürümüne ayarlı değil')
    loaded = set(re.findall(r"loadScript\('([^']+\.js)'", bootstrap))
    disk = {path.name for path in runtime.glob('*.js') if path.name != 'bootstrap-v110.js'}
    missing = sorted(loaded - disk)
    if missing:
        fail('Bootstrap tarafından çağrılan dosya eksik: ' + ', '.join(missing))
    orphan = sorted(disk - loaded)
    if orphan:
        fail('Bootstrap tarafından yüklenmeyen runtime JS bulundu: ' + ', '.join(orphan))
    for path in sorted(runtime.glob('*.js')):
        text = read_text(path)
        match = RUNTIME_FORBIDDEN.search(text)
        if match:
            fail(f'Harici runtime ağ kullanımı bulundu: {path}: {match.group(0)}')
        if re.search(r'fetch\s*\(', text) and path.name != 'learning-v200.js':
            fail(f'İzin verilmeyen runtime fetch çağrısı: {path}')
    learning = read_text(runtime / 'learning-v200.js')
    if "credentials:'same-origin'" not in learning or "body.set('_xfToken'" not in learning:
        fail('Same-origin geri bildirim güvenliği eksik')


def check_php(root):
    addon_root = root / 'upload/src/addons/Warext/TurkishSpellCheck'
    setup = read_text(addon_root / 'Setup.php')
    if '@unlink' in setup or 'glob($directory' in setup:
        fail('Yükseltmede çalışma zamanı dosyası silen kod bulundu')
    if 'upgrade5300070Step1' not in setup:
        fail('V1 yükseltme adımı eksik')
    creates = set(re.findall(r"createTable\('([^']+)'", setup))
    drops = set(re.findall(r"dropTable\('([^']+)'", setup))
    if not {'xf_warext_spell_cache', 'xf_warext_spell_feedback'}.issubset(creates):
        fail('Kurulum tablo tanımları eksik')
    if not {'xf_warext_spell_cache', 'xf_warext_spell_feedback'}.issubset(drops):
        fail('Kaldırma tablo tanımları eksik')
    learning = read_text(addon_root / 'Admin/Controller/Learning.php')
    if re.search(r'\bmb_[A-Za-z0-9_]+\s*\(', learning):
        fail('ACP controller içinde mbstring bağımlılığı bulundu')
    feedback = read_text(addon_root / 'Pub/Controller/Feedback.php')
    if 'substr(' in feedback or 'mb_substr(' in feedback:
        fail('Geri bildirimde UTF-8 güvensiz kesme bulundu')
    if 'assertPostOnly' not in feedback:
        fail('Geri bildirim controller POST doğrulaması eksik')


def check_admin_metadata(data_root, phrase_titles):
    permission_root = parse_xml(data_root / 'admin_permission.xml').getroot()
    permissions = {node.attrib.get('admin_permission_id', '') for node in permission_root.findall('admin_permission')}
    if 'warextSpellLearning' not in permissions:
        fail('ACP öğrenme izni eksik')
    nav_root = parse_xml(data_root / 'admin_navigation.xml').getroot()
    nav = [node for node in nav_root.findall('admin_navigation_entry') if node.attrib.get('navigation_id') == 'warext_spell_learning']
    if not nav:
        fail('ACP öğrenme navigasyonu eksik')
    if nav[0].attrib.get('admin_permission_id') != 'warextSpellLearning':
        fail('ACP navigasyon izin bağlantısı geçersiz')
    if 'admin_navigation.warext_spell_learning' not in phrase_titles:
        fail('ACP navigasyon phrase eksik')
    if 'admin_permission.warextSpellLearning' not in phrase_titles:
        fail('ACP izin phrase eksik')


def check_resources(root):
    resources = root / 'upload/src/addons/Warext/TurkishSpellCheck/Resources'
    required = {
        'dictionary-stats.json',
        'entity-stats.json',
        'idiom-stats.json',
        'lm-stats.json',
        'micro-model-stats.json',
        'THIRD_PARTY_DATA.txt',
        'LICENSE-MPL-2.0.txt',
        'LICENSE-TURKISH-DICTIONARY-MIT.txt',
        'LICENSE-TURKISH-DIALOGUES-CC-BY-4.0.txt'
    }
    missing = sorted(name for name in required if not (resources / name).is_file())
    if missing:
        fail('Kaynak/lisans dosyaları eksik: ' + ', '.join(missing))
    stats = parse_json(resources / 'dictionary-stats.json')
    entities = parse_json(resources / 'entity-stats.json')
    idioms = parse_json(resources / 'idiom-stats.json')
    lm = parse_json(resources / 'lm-stats.json')
    micro = parse_json(resources / 'micro-model-stats.json')
    if int(stats.get('estimatedValidWords', 0)) < 250000:
        fail('Sözlük kapsamı beklenen tabanın altında')
    if int(entities.get('locationNames', 0)) < 100000:
        fail('Yer adı indeksi beklenen tabanın altında')
    if int(idioms.get('idioms', 0)) < 500:
        fail('Deyim verisi beklenen tabanın altında')
    if int(lm.get('bigrams', 0)) < 5000:
        fail('Yerel dil modeli beklenen tabanın altında')
    if int(micro.get('samples', 0)) < 5000 or float(micro.get('accuracy', 0)) < 0.8:
        fail('Yerel mikro model doğrulaması başarısız')


def check_package(root, package_path):
    package = Path(package_path)
    if not package.is_absolute():
        package = root / package
    if package.name != 'Warext-SpellCheck-V1.zip' or not package.is_file():
        fail('Nihai V1 ZIP paketi bulunamadı')
    with zipfile.ZipFile(package) as archive:
        bad = archive.testzip()
        if bad:
            fail(f'ZIP bozuk dosya içeriyor: {bad}')
        names = set(archive.namelist())
        for name in names:
            parts = Path(name).parts
            if name.startswith('/') or '..' in parts:
                fail(f'ZIP içinde güvensiz yol bulundu: {name}')
        addon_name = 'upload/src/addons/Warext/TurkishSpellCheck/addon.json'
        if addon_name not in names or 'README.txt' not in names or 'LICENSE' not in names or 'THIRD_PARTY.md' not in names:
            fail('ZIP zorunlu eklenti ve lisans dosyalarını içermiyor')
        if any(name.startswith(('source/', 'tools/', 'tests/', '.github/')) for name in names):
            fail('ZIP geliştirme dosyaları içeriyor')
        addon = json.loads(archive.read(addon_name).decode('utf-8'))
        if addon.get('version_string') != '1.0.0' or int(addon.get('version_id', 0)) != 5300070:
            fail('ZIP içindeki addon.json V1 değil')
    release_zips = sorted((root / 'release').glob('*.zip'))
    if release_zips != [package]:
        fail('Release klasöründe V1 dışında ZIP bulundu')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('root', nargs='?', default='.')
    parser.add_argument('--package', default='')
    args = parser.parse_args()
    root = Path(args.root).resolve()
    if (root / 'BUILD_FAILURE.txt').exists():
        fail('BUILD_FAILURE.txt mevcut')
    scanned = 0
    for path in sorted(root.rglob('*')):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() == '.zip':
            continue
        relative = path.relative_to(root)
        if not is_text(relative):
            continue
        text = read_text(path)
        scanned += 1
        check_comments(relative, text)
        if path.suffix.lower() == '.json':
            parse_json(path)
        elif path.suffix.lower() == '.xml':
            parse_xml(path)
    addon_root = root / 'upload/src/addons/Warext/TurkishSpellCheck'
    data_root = addon_root / '_data'
    addon = parse_json(addon_root / 'addon.json')
    if addon.get('version_string') != '1.0.0' or int(addon.get('version_id', 0)) != 5300070:
        fail('addon.json V1 sürümü geçersiz')
    if int(addon.get('version_id', 0)) <= 5200070:
        fail('V1 version_id önceki sürümden büyük değil')
    option_ids, phrase_titles = check_options(data_root)
    check_routes(root, data_root)
    check_templates(root, data_root, option_ids)
    check_bootstrap(root)
    check_php(root)
    check_admin_metadata(data_root, phrase_titles)
    check_resources(root)
    if args.package:
        check_package(root, args.package)
    print(json.dumps({'release':'V1','filesScanned':scanned,'runtimeExternalDependencies':0,'status':'ok'}, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
