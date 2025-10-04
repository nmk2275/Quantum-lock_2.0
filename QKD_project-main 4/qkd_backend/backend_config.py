# Backend Configuration for QKD Experiments
import os
import json
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_ibm_runtime.fake_provider import FakeBrisbane
from qiskit_aer import AerSimulator

def _get_ibm_token():
    """Get IBM token from multiple sources"""
    # Method 1: Environment variable
    token = os.getenv('IBM_QUANTUM_TOKEN')
    if token:
        return token.strip().strip('"').strip("'")
    
    # Method 2: Direct JSON file read (your apikey file)
    try:
        json_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'apikey (1).json')
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                data = json.load(f)
                return data.get('apikey', '').strip()
    except Exception:
        pass
    
    # Method 3: token.env in project root
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        token_env_path = os.path.join(base_dir, 'token.env')
        if os.path.exists(token_env_path):
            with open(token_env_path, 'r') as f:
                for line in f:
                    if line.strip().startswith('IBM_QUANTUM_TOKEN'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            raw = parts[1].strip()
                            if raw and raw[0] in ('"', "'") and raw[-1] == raw[0]:
                                raw = raw[1:-1]
                            return raw.strip()
    except Exception:
        pass
    
    return None

def get_backend_service(backend_type="local"):
    """
    Get the appropriate backend service based on the backend type.
    
    Args:
        backend_type (str): Either "local" or "ibm"
        
    Returns:
        Backend service for quantum experiments
    """
    if backend_type == "ibm":
        # Use IBM Quantum backend
        try:
            # Get token from multiple sources
            token = _get_ibm_token()
            if not token:
                print("IBM token not found in any source, falling back to local backend")
                print("Sources checked: IBM_QUANTUM_TOKEN env var, ~/Downloads/apikey (1).json, token.env")
                return get_local_backend()
            
            print(f"Found IBM token: {token[:10]}...")
            
            # Try ibm_quantum_platform channel first (public IBM Quantum Experience)
            try:
                service = QiskitRuntimeService(channel="ibm_quantum_platform", token=token)
                backend = service.least_busy(operational=True, simulator=False)
                print(f"Using IBM Quantum backend: {backend.name}")
                return backend
            except Exception as e1:
                print(f"IBM Quantum channel failed: {e1}")
                
                # Try ibm_cloud channel as fallback
                try:
                    service = QiskitRuntimeService(channel="ibm_cloud", token=token)
                    backend = service.least_busy(operational=True, simulator=False)
                    print(f"Using IBM Cloud backend: {backend.name}")
                    return backend
                except Exception as e2:
                    print(f"IBM Cloud channel also failed: {e2}")
                    raise e1  # Raise the original error
            
        except Exception as e:
            print(f"IBM backend initialization failed: {e}")
            print("Falling back to local backend")
            return get_local_backend()
    else:
        # Use local simulation
        return get_local_backend()

def get_local_backend():
    """Get local simulation backend"""
    backend = FakeBrisbane()
    print(f"Using local backend: {backend.name}")
    return backend

def get_aer_simulator():
    """Get Aer simulator backend"""
    backend = AerSimulator()
    print("Using Aer simulator backend")
    return backend