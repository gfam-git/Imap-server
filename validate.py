import json, sys
try:
    with open('package.json') as f:
        data = json.load(f)
    print(f'Valid JSON. Name: {data["name"]}')
except Exception as e:
    print(f'Invalid: {e}')
    sys.exit(1)
