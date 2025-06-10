#!/usr/bin/env python3
"""
Script para verificar las dependencias de Python para procesamiento de imágenes
"""

import sys

def check_dependencies():
    missing = []
    
    try:
        import cv2
        print(f"✅ OpenCV: {cv2.__version__}")
    except ImportError:
        print("❌ OpenCV no está instalado")
        missing.append("opencv-python")
    
    try:
        import numpy as np
        print(f"✅ NumPy: {np.__version__}")
    except ImportError:
        print("❌ NumPy no está instalado")
        missing.append("numpy")
    
    try:
        import tensorflow as tf
        print(f"✅ TensorFlow: {tf.__version__}")
    except ImportError:
        print("⚠️  TensorFlow no está instalado (opcional para ML)")
        missing.append("tensorflow")
    
    if missing:
        print(f"\nDependencias faltantes: {', '.join(missing)}")
        print(f"Para instalar: pip install {' '.join(missing)}")
        return False
    else:
        print("\n✅ Todas las dependencias están instaladas")
        return True

if __name__ == "__main__":
    success = check_dependencies()
    sys.exit(0 if success else 1) 