from flask import Flask, jsonify, render_template, request
from qkd_backend.qkd_runner import exp1, exp2, exp3, exp4
from qkd_backend.backend_config import get_backend_service

app = Flask(__name__, static_folder="static")
last_exp1_result = {}
last_exp2_result = {}
last_exp3_result = {}
last_exp4_result = {}

# Store experiment results for state management
experiment_states = {}
last_analysis = {}

# ---- Serve index.html at root ----
@app.route("/")
def home():
    return render_template("index.html")  # Looks in templates/index.html

@app.route("/keyrate")
def keyrate():
    return render_template("keyrate.html")

@app.route("/KeyrateVsDistance")
def KeyrateVsDistance():
    return render_template("KeyrateVsDistance.html")

# ---- Experiment routes ----
@app.route("/run/exp1", methods=["POST"])
def exp1_route():
    global last_exp1_result
    data = request.get_json()
    message = data.get("message") if data else None
    if message is None:
        # Run experiment, store result (no message yet)
        backend_type = data.get('backend', 'local')
        # Use simple experiment for testing
        from qkd_backend.qkd_runner.exp_simple import run_simple_exp
        result = run_simple_exp(backend_type=backend_type)
        last_exp1_result = result
        return jsonify(result)
    else:
        # Use previous key to encrypt/decrypt
        if not last_exp1_result:
            return jsonify({"error": "Run the experiment first!"}), 400
        from qkd_backend.qkd_runner.exp_simple import encrypt_with_existing_key
        result = encrypt_with_existing_key(last_exp1_result, message)
        return jsonify(result)

@app.route("/run/exp2", methods=["POST"])
def exp2_route():
    global last_exp2_result
    data = request.get_json()
    message = data.get("message") if data else None
    if message is None:
        backend_type = data.get('backend', 'local')
        result = exp2.run_exp2(backend_type=backend_type)
        last_exp2_result = result
        return jsonify(result)
    else:
        if not last_exp2_result:
            return jsonify({"error": "Run the experiment first!"}), 400
        result = exp2.encrypt_with_existing_key(last_exp2_result, message)
        return jsonify(result)

@app.route("/run/exp3", methods=["POST"])
def exp3_route():
    data = request.get_json()
    backend_type = data.get('backend', 'local') if data else 'local'
    result = exp3.run_exp3(backend_type=backend_type)
    return jsonify(result)

@app.route("/run/exp4", methods=["POST"])
def exp4_route():
    data = request.get_json()
    backend_type = data.get('backend', 'local') if data else 'local'
    result = exp4.run_exp4(backend_type=backend_type)
    return jsonify(result)
@app.route("/run/<exp>", methods=["POST"])
def run_exp(exp):
    pass  # Placeholder route to be removed
    # After getting the result:
    global last_analysis
    last_analysis = result
    return jsonify(result)

@app.route("/analysis")
def analysis():
    return render_template("analysis.html")
@app.route("/shors")
def shors():
    return render_template("shors.html")


@app.route("/get_last_analysis")
def get_last_analysis():
    global last_analysis
    return jsonify(last_analysis)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5088, debug=True)