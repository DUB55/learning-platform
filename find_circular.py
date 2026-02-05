
import os
import re
import sys

def get_imports(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Simple regex for imports
    imports = re.findall(r'from [\'"](.+?)[\'"]', content)
    imports += re.findall(r'import [\'"](.+?)[\'"]', content)
    return imports

def resolve_import(base_path, import_path):
    if import_path.startswith('@/'):
        return os.path.join('apps', 'web', 'src', import_path[2:])
    if import_path.startswith('.'):
        dir_path = os.path.dirname(base_path)
        return os.path.join(dir_path, import_path)
    return None

def find_circular(start_file, visited=None, path=None):
    if visited is None: visited = set()
    if path is None: path = []
    
    if start_file in path:
        print(f"Circular dependency found: {' -> '.join(path[path.index(start_file):])} -> {start_file}")
        return True
    
    if start_file in visited:
        return False
    
    visited.add(start_file)
    
    # Try common extensions
    for ext in ['.ts', '.tsx', '/index.ts', '/index.tsx']:
        possible_file = start_file + ext
        if os.path.exists(possible_file):
            imports = get_imports(possible_file)
            for imp in imports:
                resolved = resolve_import(possible_file, imp)
                if resolved:
                    if find_circular(resolved, visited, path + [possible_file]):
                        return True
            break
    return False

root_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
app_dir = os.path.join(root_dir, 'apps', 'web', 'src')

visited = set()
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            find_circular(os.path.join(root, file), visited)

print("Done checking circular dependencies.")
