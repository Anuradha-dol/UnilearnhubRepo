import os
import re

target_dir = r"c:\Users\sasin\Desktop\UniLearnHub\Full project\websitefrontend\frontend\ui\src"

css_mappings = {
    r"#1e3a8a": "#4a443c",  # Dark blue -> Dark taupe
    r"#60a5fa": "#876d47",  # Blue-400 -> Slate brown
    r"#3b82f6": "#b49060",
    r"#0077b6": "#b49060",
    r"#00a8e8": "#876d47",
    r"rgba\(30, 58, 138": "rgba(45, 41, 38",
}

for root, _, files in os.walk(target_dir):
    for file in files:
        if file.endswith(('.jsx', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            
            for pattern, repl in css_mappings.items():
                content = re.sub(pattern, repl, content, flags=re.IGNORECASE)
                
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
