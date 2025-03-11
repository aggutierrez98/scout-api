# **Tareas**

## **Necesarias**

* [ ] Armar un google FORM para que los padres sean quienes suben los datos de sus hijos.
* [ ] Generar muestreo de rutas y consultas segun permisos en app y api
* [ ] Crear seccion de notificaciones en app y funcionalidad en api. Se notificaran documentos pendientes, por confirmar, como tambien cumpleaños, recordatorios custom, etc.

## **Menor prioridad**

* [ ] Agregar opcion de que los documentos sean confirmables por los educadores (necesiten de una firma de ellos y se notifique esa necesidad).
* [ ] Crear endpoint para crear usuarios en base a excel donde se asocien familiarId/scoutId al usuario, nombre de usuario y rol
* [ ] Crear endpoint para cargar pagos en base a excel (y que se vean los requisitos de cada fila a cargar).
* [ ] Crear endpoint para cargar documentos en base a excel (y que se vean los requisitos de cada fila a cargar).
* [ ] Agregar scripts para exportar la base de datos segun fechas
* [ ] Agregar script para importar la base de datos segun archivos
* [ ] Crear exportacion de nominas para actividades (nomina segun equipo/rama/etc).
* [ ] Generar script sh para automatizar migraciones de prisma de la base de datos([https://www.prisma.io/docs/orm/overview/databases/turso#how-to-manage-schema-changes](https://www.prisma.io/docs/orm/overview/databases/turso#how-to-manage-schema-changes))
* [ ] Mejorar sistema de roles y permisos (tambien poder asignar los mismos)
* [ ] Arreglar instancia de turso-dev-db en dockercompose file para poder levantarla en local basada en el archivo
* [ ] Ver de optimizar mapeo roles a funciones (y viceversa)
* [ ] Crear funcionalidad de eventos (que tendran asignada fecha y lugar y se podran pagar, notificar y crear autorizaciones sobre estos)

## **Terminadas**

* [X] Agregar a app react native la opcion de firmar documentos y agregar esa firma a los mismos ([https://medium.com/alameda-dev/react-native-pdf-digital-signature-b63e12cdc714](https://medium.com/alameda-dev/react-native-pdf-digital-signature-b63e12cdc714)).
* [X] Cargar PDFS a traves de node
* [X] Subir pdfs a la nube para cada joven (puedo probar inicialmente con google drive api o S3).
* [X] Pasar pdfs template a google drive
* [X] Asociar usuarios tambien a familiares
* [X] Agregar dato de mail al usuario y permitir el registro mediante un usuario previamente creado generando una contraseña
* [X] Crear todo para llenar Autorizacion de salidas/campamentos.
* [X] Terminar todos los tipos de documentos (metodos de sign y lugar de la firma)
* [X] Agregar filtos segun docu al controller de docs y despues crear esos campos en app
* [X] Mejorar script para que saque todo lo posible en funcion de la nomina (dato funcion implica mas datos adentro)
* [X] Obtener data de familiarId desde usuario para completar documentos
* [X] Agregar filtros de documentos/pagos/entregas por scout (nombre / id / dni) (agregar links a esas pantallas en app).
* [X] Mejorar mensaje de confirmacion de firma de documento y avisar que es necesario imprimir el documento.
