# Desafio Clase 30: PROXY & NGINX

### 1.Asegurese de instalar los módulos correspondientes con el comando "npm i"
### 2.Dentro de la carpeta nginx/conf/ se encuentra el archivo nginx.conf que contiene la configuracion
### 3.Iniciar proyecto con "node server.js"

### Consigna: SERVIDOR CON BALANCE DE CARGA

<p>------------------ LISTADO DE COMANDOS --------------------</p>
<p>tasklist /fi "imagename eq node.exe" -> lista todos los procesos de node.js activos</p>
<p>taskkill /pid numpid /f -> mata un proceso por su número de PID</p>

<p>npm i -g pm2</p>
<p>npm list -g | grep pm2</p>

<p>------------------ MODO FORK --------------------</p>
<p>pm2 start server.js --name="Server1" --watch -p 8081</p>

<p>----------------- MODO CLUSTER -------------------
<p>pm2 start server.js --name="Server2" --watch -i max -p 8082</p>

<p>pm2 list</p>
<p>pm2 delete id/name</p>
<p>pm2 desc name</p>
<p>pm2 monit</p>
<p>pm2 --help</p>
<p>pm2 logs</p>
<p>pm2 flush</p>

<p>------------------ NGINX ----------------------</p>
<p>http://nginx.org/en/docs/windows.html</p>
<p>start nginx</p>
<p>tasklist /fi "imagename eq nginx.exe"</p>
<p>nginx -s reload</p>
<p>nginx -s quit</p>

