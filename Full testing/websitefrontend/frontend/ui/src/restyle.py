import os
import re

target_dir = r"c:\Users\sasin\Desktop\UniLearnHub\Full project\websitefrontend\frontend\ui\src"

tailwind_mappings = {
    r"bg-slate-50\b": "bg-[#fcfbf9]",
    r"bg-slate-100\b": "bg-[#f1efe9]",
    r"bg-slate-200\b": "bg-[#e8e4db]",
    r"bg-slate-300\b": "bg-[#d4cebd]",
    r"bg-slate-400\b": "bg-[#a39c93]",
    r"bg-slate-500\b": "bg-[#827a71]",
    r"bg-slate-600\b": "bg-[#5c544d]",
    r"bg-slate-700\b": "bg-[#4a443c]",
    r"bg-slate-800\b": "bg-[#2d2926]",
    r"bg-slate-900\b": "bg-[#2d2926]",
    
    r"text-slate-50\b": "text-[#fcfbf9]",
    r"text-slate-100\b": "text-[#f1efe9]",
    r"text-slate-200\b": "text-[#e8e4db]",
    r"text-slate-300\b": "text-[#d4cebd]",
    r"text-slate-400\b": "text-[#a39c93]",
    r"text-slate-500\b": "text-[#827a71]",
    r"text-slate-600\b": "text-[#5c544d]",
    r"text-slate-700\b": "text-[#4a443c]",
    r"text-slate-800\b": "text-[#2d2926]",
    r"text-slate-900\b": "text-[#2d2926]",
    
    r"border-slate-100\b": "border-[#f1efe9]",
    r"border-slate-200\b": "border-[#e8e4db]",
    r"border-slate-300\b": "border-[#d4cebd]",
    r"border-slate-400\b": "border-[#a39c93]",
    r"border-slate-500\b": "border-[#827a71]",

    r"(bg|text|border|ring|shadow)-blue-50\b": r"\1-[#faf5eb]",
    r"(bg|text|border|ring|shadow)-blue-100\b": r"\1-[#efeedd]",
    r"(bg|text|border|ring|shadow)-blue-200\b": r"\1-[#e8e4db]",
    r"(bg|text|border|ring|shadow)-blue-300\b": r"\1-[#b49060]/50",
    r"(bg|text|border|ring|shadow)-blue-400\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-blue-500\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-blue-600\b": r"\1-[#9c7c59]",
    r"(bg|text|border|ring|shadow)-blue-700\b": r"\1-[#876d47]",
    r"(bg|text|border|ring|shadow)-blue-800\b": r"\1-[#5c544d]",
    
    r"(bg|text|border|ring|shadow)-indigo-50\b": r"\1-[#faf5eb]",
    r"(bg|text|border|ring|shadow)-indigo-100\b": r"\1-[#efeedd]",
    r"(bg|text|border|ring|shadow)-indigo-200\b": r"\1-[#e8e4db]",
    r"(bg|text|border|ring|shadow)-indigo-300\b": r"\1-[#b49060]/50",
    r"(bg|text|border|ring|shadow)-indigo-400\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-indigo-500\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-indigo-600\b": r"\1-[#9c7c59]",
    r"(bg|text|border|ring|shadow)-indigo-700\b": r"\1-[#876d47]",
    r"(bg|text|border|ring|shadow)-indigo-800\b": r"\1-[#5c544d]",

    r"(bg|text|border|ring|shadow)-sky-50\b": r"\1-[#faf5eb]",
    r"(bg|text|border|ring|shadow)-sky-100\b": r"\1-[#efeedd]",
    r"(bg|text|border|ring|shadow)-sky-200\b": r"\1-[#e8e4db]",
    r"(bg|text|border|ring|shadow)-sky-300\b": r"\1-[#b49060]/50",
    r"(bg|text|border|ring|shadow)-sky-400\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-sky-500\b": r"\1-[#b49060]",
    r"(bg|text|border|ring|shadow)-sky-600\b": r"\1-[#9c7c59]",
    r"(bg|text|border|ring|shadow)-sky-700\b": r"\1-[#876d47]",

    r"(bg|text|border|ring|shadow)-rose-50\b": r"\1-[#fcf1ef]",
    r"(bg|text|border|ring|shadow)-rose-100\b": r"\1-[#f0c3be]",
    r"(bg|text|border|ring|shadow)-rose-500\b": r"\1-[#c36254]",
    r"(bg|text|border|ring|shadow)-rose-600\b": r"\1-[#b45648]",
}

css_mappings = {
    r"#3b82f6": "#b49060",
    r"#0ea5e9": "#b49060",
    r"#2563eb": "#9c7c59",
    r"#1d4ed8": "#876d47",
    r"#4f46e5": "#b49060",
    r"#6366f1": "#b49060",
    r"#4338ca": "#9c7c59",
    r"#0284c7": "#9c7c59",
    r"#0369a1": "#876d47",
    r"#64748b": "#827a71",
    r"#94a3b8": "#a39c93",
    r"#e2e8f0": "#e8e4db",
    r"#f1f5f9": "#fcfbf9",
    r"#f8fafc": "#ffffff",
    r"#0f172a": "#2d2926",
    r"#1e293b": "#2d2926",
    r"#334155": "#4a443c",
    r"rgba\(59,\s*130,\s*246": "rgba(180, 144, 96",
    r"rgba\(37,\s*99,\s*235": "rgba(156, 124, 89",
    r"rgba\(14,\s*165,\s*233": "rgba(180, 144, 96",
    r"rgba\(99,\s*102,\s*241": "rgba(180, 144, 96",
    r"rgba\(79,\s*70,\s*229": "rgba(156, 124, 89",
    r"rgba\(148,\s*163,\s*184": "rgba(180, 144, 96",
    r"rgba\(226,\s*232,\s*240": "rgba(232, 228, 219",
    r"rgba\(15,\s*23,\s*42": "rgba(45, 41, 38",
    r"rgba\(30,\s*41,\s*59": "rgba(45, 41, 38",
}

gradient_mappings = {
    r"linear-gradient\(120deg, #2563eb, #06b6d4\)": "linear-gradient(120deg, #b49060, #876d47)",
    r"linear-gradient\(135deg, #3b82f6 0%, #8b5cf6 100%\)": "linear-gradient(135deg, #b49060 0%, #876d47 100%)",
    r"linear-gradient\(135deg, #2563eb 0%, #7c3aed 100%\)": "linear-gradient(135deg, #9c7c59 0%, #876d47 100%)",
    r"linear-gradient\(to top right, #3b82f6, #8b5cf6\)": "linear-gradient(to top right, #b49060, #876d47)",
    r"linear-gradient\(to bottom right, #2563eb, #7c3aed\)": "linear-gradient(to bottom right, #9c7c59, #876d47)",
    r"from-blue-500 to-indigo-600": "from-[#b49060] to-[#876d47]",
    r"from-indigo-500 to-purple-600": "from-[#b49060] to-[#876d47]",
    r"from-blue-600 to-indigo-700": "from-[#9c7c59] to-[#5c544d]",
}

for root, _, files in os.walk(target_dir):
    for file in files:
        if file.endswith(('.jsx', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            
            if file.endswith('.jsx'):
                for pattern, repl in tailwind_mappings.items():
                    content = re.sub(pattern, repl, content)
            
            for pattern, repl in css_mappings.items():
                content = re.sub(pattern, repl, content, flags=re.IGNORECASE)
                
            for pattern, repl in gradient_mappings.items():
                content = re.sub(pattern, repl, content, flags=re.IGNORECASE)
                
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
