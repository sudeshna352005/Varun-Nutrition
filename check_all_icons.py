import re
import os

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all imports from lucide-react
    lucide_imports = re.findall(r"import\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]lucide-react['\"]", content)
    imported_icons = set()
    for imp in lucide_imports:
        imported_icons.update(icon.strip() for icon in imp.split(','))

    # Find all usages
    # 1. JSX tags: <IconName
    jsx_usages = re.findall(r"<([A-Z][a-zA-Z0-9]+)", content)
    # 2. Icon props: icon: IconName
    prop_usages = re.findall(r"icon:\s*([A-Z][a-zA-Z0-9]+)", content)

    all_usages = set(jsx_usages) | set(prop_usages)

    # Known non-icon components to exclude
    exclude = {
        'React', 'Link', 'BrowserRouter', 'Route', 'Routes', 'Navigate', 'App',
        'DashboardAnalytics', 'DateFilter', 'Skeleton', 'XLSX', 'api', 'getImageUrl',
        'isInRange', 'getRangeDates', 'Recharts', 'LineChart', 'Line', 'XAxis', 'YAxis',
        'CartesianGrid', 'Tooltip', 'Legend', 'ResponsiveContainer', 'BarChart', 'Bar',
        'PieChart', 'Pie', 'Cell', 'AreaChart', 'Area', 'StrictMode', 'Brand',
        'Login', 'ShopManagement', 'WorkerManagement', 'ProductManagement',
        'WorkerProfile', 'WorkerDashboard', 'OrdersView', 'OwnerDashboard',
        'RouteManagement', 'ReportsView', 'WorkerAttendance', 'AttendanceView',
        'Navbar', 'Router', 'Provider'
    }

    missing = []
    for usage in all_usages:
        if usage not in imported_icons and usage not in exclude:
            # Check if it's defined in the file
            if f"const {usage} =" not in content and f"function {usage}" not in content:
                # Check if it's imported from elsewhere (crude check)
                if f"import {usage}" not in content and f"import {{ {usage}" not in content:
                    missing.append(usage)

    if missing:
        print(f"File: {filepath}")
        print(f"  Missing imports: {missing}")

for root, dirs, files in os.walk('client/src'):
    for file in files:
        if file.endswith('.jsx'):
            check_file(os.path.join(root, file))
