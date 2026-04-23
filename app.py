from flask import Flask, render_template, jsonify, request
import json
import random
import os

app = Flask(__name__)

RIDDLES_FILE = os.path.join(os.path.dirname(__file__), 'data', 'riddles.json')
PENDING_RIDDLES_FILE = os.path.join(os.path.dirname(__file__), 'data', 'pending_riddles.json')

def load_riddles():
    with open(RIDDLES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_pending_riddles():
    if os.path.exists(PENDING_RIDDLES_FILE):
        with open(PENDING_RIDDLES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_pending_riddles(riddles):
    with open(PENDING_RIDDLES_FILE, 'w', encoding='utf-8') as f:
        json.dump(riddles, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/riddle')
def get_riddle():
    riddles = load_riddles()
    riddle = random.choice(riddles)
    return jsonify(riddle)

@app.route('/api/riddle/<category>')
def get_riddle_by_category(category):
    riddles = load_riddles()
    category_riddles = [r for r in riddles if r.get('category') == category]
    if category_riddles:
        riddle = random.choice(category_riddles)
        return jsonify(riddle)
    return jsonify({'error': 'Category not found'}), 404

@app.route('/api/categories')
def get_categories():
    riddles = load_riddles()
    categories = set(r.get('category') for r in riddles)
    return jsonify(list(categories))

@app.route('/api/all-riddles')
def get_all_riddles():
    riddles = load_riddles()
    return jsonify(riddles)

@app.route('/api/submit-riddle', methods=['POST'])
def submit_riddle():
    try:
        riddle_data = request.json
        if not riddle_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # 验证必填字段
        required_fields = ['question', 'answer', 'category']
        for field in required_fields:
            if field not in riddle_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # 加载待审核的谜语
        pending_riddles = load_pending_riddles()
        
        # 生成新ID
        new_id = len(pending_riddles) + 1
        riddle_data['id'] = new_id
        riddle_data['status'] = 'pending'
        
        # 添加到待审核列表
        pending_riddles.append(riddle_data)
        save_pending_riddles(pending_riddles)
        
        return jsonify({'message': 'Riddle submitted successfully. Waiting for approval.'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8723, debug=True)
