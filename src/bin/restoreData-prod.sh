#!/bin/bash
# -*- ENCODING: UTF-8 -*-

npm run deleteDBData:prod && npm run load-familiares:prod && npm run load-equipos:prod && npm run load-scouts:prod && npm run load-pagos:prod && npm run load-documentos:prod && npm run load-entregas:prod

exit