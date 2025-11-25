#!/bin/sh
set -e

echo "🔍 Verificando estado de la base de datos..."

# Archivo de datos de LibSQL
DATA_FILE="/var/lib/sqld/scout.db/dbs/default/data"
SOURCE_FILE="/tmp/source-scout.db"

if [ ! -f "$DATA_FILE" ]; then
    echo "📦 Primera inicialización - copiando base de datos..."
    
    # Crear estructura de directorios
    mkdir -p /var/lib/sqld/scout.db/dbs/default
    
    # Copiar archivo fuente
    if [ -f "$SOURCE_FILE" ]; then
        cp -v "$SOURCE_FILE" "$DATA_FILE"
        echo "✅ Base de datos copiada: $(ls -lh $DATA_FILE | awk '{print $5}')"
    else
        echo "❌ Error: Archivo fuente $SOURCE_FILE no encontrado"
        exit 1
    fi
else
    echo "✅ Base de datos ya existe: $(ls -lh $DATA_FILE | awk '{print $5}')"
fi

echo "🚀 Iniciando LibSQL Server..."
exec sqld
