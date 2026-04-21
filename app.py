from flask import Flask, render_template, jsonify
import json
import random
import os

app = Flask(__name__)

RIDDLES_FILE = os.path.join(os.path.dirname(__file__), 'data', 'riddles.json')

def load_riddles():
    with open(RIDDLES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/riddle')
def get_riddle():
    riddles = load_riddles()
    riddle = random.choice(riddles)
    return jsonify(riddle)

@app.route('/api/all-riddles')
def get_all_riddles():
    riddles = load_riddles()
    return jsonify(riddles)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8723, debug=True)
