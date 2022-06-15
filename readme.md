# Desafio Clase 30: PROXY & NGINX

## 1.Asegurese de instalar los módulos correspondientes con el comando "npm i"
## 2.Dentro de la carpeta nginx/conf/ se encuentra el archivo nginx.conf que contiene la configuracion
## 3.Iniciar proyecto con "node server.js"

### Consigna: SERVIDOR CON BALANCE DE CARGA

------------------ LISTADO DE COMANDOS --------------------
tasklist /fi "imagename eq node.exe" -> lista todos los procesos de node.js activos
taskkill /pid numpid /f -> mata un proceso por su número de PID

npm i -g pm2
npm list -g | grep pm2

------------------ MODO FORK --------------------
pm2 start server.js --name="Server1" --watch -p 8081

----------------- MODO CLUSTER -------------------
pm2 start server.js --name="Server2" --watch -i max -p 8082

pm2 list
pm2 delete id/name
pm2 desc name
pm2 monit
pm2 --help
pm2 logs
pm2 flush

------------------ NGINX ----------------------
http://nginx.org/en/docs/windows.html
start nginx
tasklist /fi "imagename eq nginx.exe"
nginx -s reload
nginx -s quit

