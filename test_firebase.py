import sys
import os.path

# Add the parent directory to sys.path to find the firebase module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

print("Python path:", sys.path)

try:
    # Try to directly import the module
    print("Attempting to import module...")
    import firebase.firebase_service
    print("Module imported, checking for class...")
    
    # Check the module's contents
    print("Module contents:", dir(firebase.firebase_service))
    
    # Try to access the class
    FirebaseService = firebase.firebase_service.FirebaseService
    print("Successfully imported FirebaseService")
    
    # Try to initialize Firebase
    firebase = FirebaseService.get_instance()
    firebase.initialize()
    
    if firebase.initialized:
        print("Firebase initialized successfully!")
    else:
        print("Firebase initialization failed.")
except Exception as e:
    print(f"Error: {str(e)}")
