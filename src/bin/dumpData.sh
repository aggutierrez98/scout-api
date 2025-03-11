#!/bin/bash
# -*- ENCODING: UTF-8 -*-

# TODO: en un futuro eliminar esta linea si se consigue crear instancia de docker de la bd
{ turso dev --db-file ./src/prisma/scout.db --port 9000; } &
npm run deleteDBData:dev && npm run save-users:dev && npm run load-familiares:dev && npm run load-equipos:dev && npm run load-scouts:dev && npm run load-pagos:dev && npm run load-documentos:dev && npm run load-entregas:dev

exit