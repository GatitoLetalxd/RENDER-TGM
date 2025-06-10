#!/usr/bin/env python3
"""
Procesamiento de Imágenes con MBLLEN (Multi-Branch Low-Light Enhancement Network)
Este script implementa el procesamiento de imágenes para mejorar imágenes en condiciones de baja luminosidad.

Fallback: Si el modelo ML no está disponible, usa técnicas básicas de OpenCV.
"""

import os
import sys
import numpy as np
import cv2

def enhance_image_basic(image):
    """
    Mejora básica de imagen usando técnicas de OpenCV
    """
    try:
        # 1. Conversión a LAB para mejor manipulación de luminosidad
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # 2. Aplicar CLAHE (Contrast Limited Adaptive Histogram Equalization) al canal L
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        # 3. Combinar canales
        enhanced_lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        # 4. Ajuste adicional de brillo y contraste
        alpha = 1.2  # Factor de contraste
        beta = 20    # Factor de brillo
        enhanced = cv2.convertScaleAbs(enhanced, alpha=alpha, beta=beta)
        
        # 5. Reducción de ruido
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        return enhanced
        
    except Exception as e:
        print(f"Error en mejora básica: {e}", file=sys.stderr)
        return image

def process_image_ml(input_path, output_path):
    """
    Procesamiento con modelo ML (MBLLEN)
    """
    try:
        import tensorflow as tf
        from tensorflow.keras.layers import Input, Conv2D, Concatenate
        from tensorflow.keras.models import Model
        
        print("Cargando modelo ML...")
        
        # Verificar que el modelo existe
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'LOL_img_lowlight.h5')
        if not os.path.exists(model_path):
            raise Exception(f"Modelo no encontrado: {model_path}")
        
        # Cargar imagen
        img = cv2.imread(input_path)
        if img is None:
            raise Exception("No se pudo cargar la imagen")
            
        original_shape = img.shape
        print(f"Imagen cargada: {original_shape}")
        
        # Redimensionar para el modelo (si es necesario)
        img_resized = cv2.resize(img, (512, 512))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_normalized = img_rgb.astype(np.float32) / 255.0
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        # Construir modelo simplificado
        input_layer = Input(shape=(512, 512, 3))
        x = Conv2D(32, (3, 3), activation='relu', padding='same')(input_layer)
        x = Conv2D(32, (3, 3), activation='relu', padding='same')(x)
        x = Conv2D(32, (5, 5), activation='relu', padding='same')(x)
        x = Conv2D(3, (3, 3), activation='sigmoid', padding='same')(x)
        
        model = Model(inputs=input_layer, outputs=x)
        
        try:
            model.load_weights(model_path)
            print("Modelo cargado exitosamente")
        except:
            print("No se pudo cargar los pesos del modelo, usando mejora básica")
            raise Exception("Modelo no disponible")
            
        # Procesar imagen
        enhanced = model.predict(img_batch, verbose=0)
        enhanced = (enhanced[0] * 255).astype(np.uint8)
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_RGB2BGR)
        
        # Redimensionar de vuelta al tamaño original
        if original_shape[:2] != (512, 512):
            enhanced = cv2.resize(enhanced, (original_shape[1], original_shape[0]))
        
        # Guardar imagen
        cv2.imwrite(output_path, enhanced)
        print(f"Imagen procesada con ML guardada: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error en procesamiento ML: {e}", file=sys.stderr)
        return False

def process_image_basic_fallback(input_path, output_path):
    """
    Procesamiento básico como fallback
    """
    try:
        print("Usando procesamiento básico...")
        
        # Cargar imagen
        img = cv2.imread(input_path)
        if img is None:
            raise Exception("No se pudo cargar la imagen")
            
        print(f"Imagen cargada: {img.shape}")
        
        # Aplicar mejora básica
        enhanced = enhance_image_basic(img)
        
        # Guardar imagen
        cv2.imwrite(output_path, enhanced)
        print(f"Imagen procesada básica guardada: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error en procesamiento básico: {e}", file=sys.stderr)
        return False

def main():
    if len(sys.argv) != 3:
        print("Uso: python image_processing.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    print(f"Iniciando procesamiento...")
    print(f"Imagen de entrada: {input_path}")
    print(f"Imagen de salida: {output_path}")
    
    # Verificar que la imagen de entrada existe
    if not os.path.exists(input_path):
        print(f"Error: No se encuentra la imagen de entrada: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    # Crear directorio de salida si no existe
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Directorio creado: {output_dir}")
    
    # Intentar procesamiento ML primero, luego fallback
    success = False
    
    # Primero intentar con ML
    try:
        success = process_image_ml(input_path, output_path)
    except Exception as e:
        print(f"ML no disponible: {e}", file=sys.stderr)
    
    # Si ML falló, usar procesamiento básico
    if not success:
        print("Cambiando a procesamiento básico...")
        success = process_image_basic_fallback(input_path, output_path)
    
    if success:
        print("Procesamiento completado exitosamente")
        sys.exit(0)
    else:
        print("Error: No se pudo procesar la imagen", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()



