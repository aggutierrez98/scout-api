#!/bin/bash
# -*- ENCODING: UTF-8 -*-

npm run deleteDBData:dev && npm run load-familiares:dev && npm run load-scouts:dev && npm run load-pagos:dev && npm run load-documentos:dev && npm run load-entregas:dev

exit