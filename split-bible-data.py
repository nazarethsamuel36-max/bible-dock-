import json
import os

# Load the large bible_full.json
with open('public/bible_full.json', 'r', encoding='utf-8') as f:
    bible_data = json.load(f)

# Create data directory
os.makedirs('public/data', exist_ok=True)

# Split by book and language
for lang in ['en', 'hi']:
    if lang not in bible_data:
        continue
    
    for book_name, book_data in bible_data[lang].items():
        # Create book file
        book_file_path = f'public/data/{lang}/{book_name.lower()}.json'
        os.makedirs(os.path.dirname(book_file_path), exist_ok=True)
        
        with open(book_file_path, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, ensure_ascii=False)
        
        print(f'Created {book_file_path}')

print('Bible data split successfully!')
