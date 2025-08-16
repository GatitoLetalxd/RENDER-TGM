#!/bin/bash

# Directorio del proyecto
PROJECT_DIR="/var/www/RENDER-TGM"

# Función para iniciar la aplicación
start_app() {
    echo "Iniciando RENDER-TGM..."
    cd "$PROJECT_DIR"
    
    # Detener solo las instancias de RENDER-TGM si existen
    pm2 delete render-tgm-backend > /dev/null 2>&1
    pm2 delete render-tgm-frontend > /dev/null 2>&1
    
    # Iniciar aplicación usando el archivo de configuración
    pm2 start ecosystem.config.cjs
    
    # Guardar la configuración de PM2
    pm2 save
    
    echo "RENDER-TGM se ha iniciado correctamente."
}

# Función para detener la aplicación
stop_app() {
    echo "Deteniendo RENDER-TGM..."
    pm2 delete render-tgm-backend render-tgm-frontend
    pm2 save
    echo "RENDER-TGM se ha detenido correctamente."
}

# Función para reiniciar la aplicación
restart_app() {
    echo "Reiniciando RENDER-TGM..."
    pm2 restart render-tgm-backend render-tgm-frontend
    echo "RENDER-TGM se ha reiniciado correctamente."
}

# Función para mostrar el estado
status_app() {
    echo "Estado de RENDER-TGM:"
    pm2 list | grep "render-tgm"
    echo ""
    echo "Logs disponibles con: pm2 logs render-tgm-backend render-tgm-frontend"
}

# Manejo de argumentos
case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        status_app
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0 