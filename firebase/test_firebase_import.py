# test_firebase_import.py inside firebase directory
import os
import sys

print("Current directory:", os.getcwd())
print("Python path:", sys.path)

try:
    # Direct import using relative path
    from firebase_service import FirebaseService
    print("Successfully imported FirebaseService with relative import")
except Exception as e:
    print(f"Relative import error: {str(e)}")

try:
    # Absolute import
    import firebase_service
    print("Successfully imported firebase_service module")
    print("Module contents:", dir(firebase_service))
    if hasattr(firebase_service, 'FirebaseService'):
        print("FirebaseService class exists in module")
    else:
        print("FirebaseService class does not exist in module")
except Exception as e:
    print(f"Absolute import error: {str(e)}")
