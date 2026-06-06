import re
import os

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all imports from lucide-react
    # import { Icon1, Icon2 } from 'lucide-react';
    import_match = re.search(r"import\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]lucide-react['\"]", content)
    if not import_match:
        imported_icons = set()
    else:
        imported_icons = set(icon.strip() for icon in import_match.group(1).split(','))

    # Find all usages of icons (starting with uppercase, used as components or passed as props)
    # <IconName ... /> or icon: IconName
    # This is a bit tricky, but let's look for common patterns
    usages = set()
    # Component usage: <IconName
    usages.update(re.findall(r"<([A-Z][a-zA-Z0-9]+)", content))
    # Prop usage: icon: IconName
    usages.update(re.findall(r"icon:\s*([A-Z][a-zA-Z0-9]+)", content))

    # Common lucide icons list (subset for verification)
    # We only care about icons that LOOK like lucide icons and are NOT imported
    # but we need to exclude components defined in the file or imported from elsewhere.

    # Let's just list what's used but not imported from lucide-react
    # and see if they look like lucide icons.

    potentially_missing = []
    for usage in usages:
        if usage not in imported_icons:
            # Exclude React, and components imported from elsewhere
            if usage not in ['React', 'Link', 'BrowserRouter', 'Route', 'Routes', 'Navigate', 'App', 'DashboardAnalytics', 'DateFilter', 'Skeleton', 'XLSX', 'api', 'getImageUrl', 'isInRange', 'getRangeDates', 'Recharts', 'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend', 'ResponsiveContainer', 'BarChart', 'Bar', 'PieChart', 'Pie', 'Cell', 'AreaChart', 'Area']:
                # Also exclude components defined in the file (very crude check)
                if f"const {usage} =" not in content and f"function {usage}" not in content:
                    potentially_missing.append(usage)

    if potentially_missing:
        print(f"File: {filepath}")
        print(f"  Used but not imported from lucide-react: {potentially_missing}")

# Scan src directory
for root, dirs, files in os.walk('client/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            check_file(os.path.join(root, file))
