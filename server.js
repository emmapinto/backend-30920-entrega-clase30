//tasklist /fi "imagename eq node.exe" -> lista todos los procesos de node.js activos
//taskkill /pid numpid /f -> mata un proceso por su número de PID

//npm i -g pm2
//npm list -g | grep pm2

// -------------- MODO FORK -------------------
//pm2 start server.js --name="Server1" --watch -p 8081

// -------------- MODO CLUSTER -------------------
//pm2 start server.js --name="Server2" --watch -i max -p 8082

//pm2 list
//pm2 delete id/name
//pm2 desc name
//pm2 monit
//pm2 --help
//pm2 logs
//pm2 flush

// ------------------ NGINX ----------------------
//http://nginx.org/en/docs/windows.html
//start nginx
//tasklist /fi "imagename eq nginx.exe"
//nginx -s reload
//nginx -s quit


import "dotenv/config";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import handlebars from "express-handlebars";
import mongoose from "mongoose";
import faker from "faker";
import passport from "passport";
import bCrypt from "bcrypt";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "./models/user.js";

import { Server as Socket } from "socket.io";
import { fork } from "child_process";
import os from "os";
import cluster from "cluster";

const numCPUs = os.cpus().length;
const app = express();

const mongoDbUri = process.env.MONGO_DB_URI;
// const port = process.env.PORT || 8080;
const port = parseInt(process.argv[2]) || 8082;
// console.log(parseInt(process.argv[2]));

/* --------- START COMPUTO Y RANDOM ---------- */

const ChildProcessFork = process.env.CHILD_PROCESS_FORK;

if (ChildProcessFork) {
	let calculo = fork("./computo.js");

	var taskId = 0;
	var tasks = {};

	function addTask(data, callback) {
		var id = taskId++;
		calculo.send({ id: id, data: data });
		tasks[id] = callback;
	}

	calculo.on("message", function (message) {
		tasks[message.id](message);
	});

	app.get("/api/randoms", async (req, res) => {
		// addTask(req.query.cant || 100000000, (randoms) => {
		addTask(req.query.cant || 1000, (randoms) => {
			res.json(randoms);
		});
	});
} else {
	app.get("/api/randoms", async (req, res) => {
		res.send('<h2 style="color: orangered;">randoms -> no implementado!</h2>');
	});
}

/* --------- END COMPUTO Y RANDOM ---------- */

let productos = [ ];
let id=1

app.use(cookieParser());
app.use(
	session({
		store: MongoStore.create({
			mongoUrl: mongoDbUri,
			ttl: 600,
		}),
		secret: "sh",
		resave: false,
		saveUninitialized: false,
		rolling: false,
		cookie: {
			maxAge: 600000,
		},
	})
);

app.engine(
	"hbs",
	handlebars({
		extname: ".hbs",
		defaultLayout: "index.hbs",
	})
);
app.set("view engine", "hbs");
app.set("views", "./views");

// app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
	"login",
	new LocalStrategy(
		{
			passReqToCallback: true,
		},
		(req, username, password, cb) => {
			User.findOne({ username: username }, (err, user) => {
				if (err) return done(err);
				if (!user) {
					console.log("User Not Found with username " + username);
					return cb(null, false);
				}
				if (!validatePassword(user, password)) {
					console.log("Invalid Password");
					return cb(null, false);
				}
				return cb(null, user);
			});
		}
	)
);

const validatePassword = (user, password) => {
	return bCrypt.compareSync(password, user.password);
};

passport.use(
	"register",
	new LocalStrategy(
		{
			passReqToCallback: true,
		},
		function (req, username, password, cb) {
			const findOrCreateUser = function () {
				User.findOne({ username: username }, function (err, user) {
					if (err) {
						console.log("Error in SignUp: " + err);
						return cb(err);
					}
					if (user) {
						console.log("User already exists");
						return cb(null, false);
					} else {
						var newUser = new User();
						newUser.username = username;
						newUser.password = createHash(password);
						newUser.save((err) => {
							if (err) {
								console.log("Error in Saving user: " + err);
								throw err;
							}
							console.log("User Registration succesful");
							return cb(null, newUser);
						});
					}
				});
			};
			process.nextTick(findOrCreateUser);
		}
	)
);

var createHash = function (password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};
// Con la serialización, se almacena el ID de la sesión
passport.serializeUser((user, done) => {
	done(null, user._id);
});

// Con deserializar, se obtiene el usuario a partir del ID
passport.deserializeUser((id, done) => {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

app.get("/ses", (req, res) => {
	console.log(req.session);
	res.send("Revisar consola");
});

app.post(
	"/login",
	passport.authenticate("login", { failureRedirect: "/faillogin" }),
	(req, res) => {
		res.redirect("/");
	}
);

app.get("/faillogin", (req, res) => {
	res.render("login-error", {});
});


app.get("/register", (req, res) => {
	res.render("register");
});

app.post(
	"/register",
	passport.authenticate("register", { failureRedirect: "/failregister" }),
	(req, res) => {
		res.redirect("/");
	}
);

app.get("/failregister", (req, res) => {
	res.render("register-error", {});
});

// Cerrar sesión es una función de Passport para borrar la sesión.
// Este req.user.username es creado por Passport cuando serializa al usuario
app.get("/logout", (req, res) => {
	const { username } = req.user;
	req.logout();
	res.render("logout", { username });
});

app.get("/login", (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect("/");
	} else {
		res.render("login");
	}
});

// El req.user.username no solo devuelve la ID, sino todo el usuario
app.get("/", (req, res) => {
	if (req.isAuthenticated()) {
		for (let i = 0; i < 10; i++){
            const producto = {
                nombre: faker.commerce.productName(),
                precio: faker.commerce.price(),
                foto: faker.image.imageUrl(),
                id: id++
            }
            productos.push(producto);
        }
		res.render("index", { username: req.user.username, item: productos });
        productos=[]
        id=1
	} else {
		res.redirect("login");
	}
});

/* ------------- Consigna: vista de datos ----------------- */

app.get("/info", (req, res) => {

	res.render("info", {
		argum: JSON.stringify(process.argv, null, "\t"),
		plat: process.platform,
		ver: process.version,
		mem: JSON.stringify(process.memoryUsage(), null, "\t"),
		execPath: process.execPath,
		pid: process.pid,
		carp: process.cwd()
	});
});

/* -------------------------MASTER------------------------------ */

if (process.argv[2] === "cluster" && cluster.isPrimary) {
	console.log("numCPUs: ", numCPUs);
	console.log(`Modo Cluster - PID MASTER ${process.pid}`);
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	cluster.on("exit", (worker) => {
		console.log("Worker", worker.process.pid, " died");
	});
} else {
	const server = app.listen(port, (err) => {
		if (!err)
			console.log(
				`Modo Fork - Servidor express escuchando en el puerto ${port} - PID WORKER ${process.pid}`
			);
	});
}

/* -------------------------------------------------------- */

app.get('/datos', (req,res) => {
    console.log(`port: ${port} -> Fyh: ${Date.now()}`)
    res.send(`Servidor express <span style="color:blueviolet;">(Nginx)</span> en ${port} - <b>PID ${process.pid}</b> - ${new Date().toLocaleString()}`)
})

const srv = app.listen(port, async () => {
	console.log(`Servidor http escuchando en el puerto ${srv.address().port}`);
	try {
		const mongo = await mongoose.connect(mongoDbUri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Connected DB");
	} catch (error) {
		console.log(`Error en conexión de Base de datos: ${error}`);
	}
});
srv.on("error", (error) => console.log(`Error en servidor ${error}`));
