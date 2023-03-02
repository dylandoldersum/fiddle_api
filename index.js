// Using the .env file for global variables.
require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
//Assigning express package to api variable.
const api = express();

//Establishing a mysql connection.
function handleDisconnect() {
    connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "fiddle_store",
    });

    connection.connect(function (err) {
        if (err) {
            console.log("error when connecting to db:", err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log("connection is successfull");
        }
    });
    connection.on("error", function (err) {
        console.log("db error", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

api.use(cors());
//Setting up body parser to support json data.
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));

/**
 * Assigning port to api.
 */
api.listen(3001, () => {
    console.log("Listening on port: 3001");
});


api.get("/get-products", (req, res) => {
    connection.query("SELECT * FROM products", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

api.get("/get-categories", (req, res) => {
    connection.query("SELECT * FROM product_categories", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

api.get("/get-discount-products", (req, res) => {
    connection.query("SELECT * FROM products WHERE discount_price > 0", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

api.get("/get-products/:id", (req, res) => {
    connection.query("SELECT * FROM products WHERE product_categorie = ?", [req.params.id], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

api.post("/update-product", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const id = req.body.id;
        const sku = req.body.sku;
        const item_name = req.body.name;
        const item_price = req.body.price;
        const item_image = req.body.thumbnail;
        const product_categorie = req.body.category;
        console.log(sku);
        connection.query("UPDATE products SET sku=?, item_name=?, item_price=?, item_image=?, product_categorie=? WHERE id=?",
            [sku, item_name, item_price, item_image, product_categorie, id],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/update-category", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const id = req.body.id;
        const cat_name = req.body.name;
        connection.query("UPDATE product_categories SET category_name=? WHERE id=?",
            [cat_name, id],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/insert-product", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const id = req.body.id;
        const sku = req.body.sku;
        const item_name = req.body.name;
        const item_price = req.body.price;
        const item_image = req.body.thumbnail;
        const product_categorie = req.body.category;
        connection.query("INSERT INTO products (sku, item_name, item_price, item_image, product_categorie) VALUES (?, ?, ?, ?, ?)",
            [sku, item_name, item_price, item_image, product_categorie, id],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/insert-category", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const cat_name = req.body.name;
        connection.query("INSERT INTO product_categories (category_name) VALUES (?)",
            [cat_name],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/delete-product/:id", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const id = req.params.id;
        connection.query("DELETE FROM products WHERE id=?",
            [id],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/delete-category/:id", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const id = req.params.id;
        connection.query("DELETE FROM product_categories WHERE id=?",
            [id],
            (error) => {
                if (error) throw error;
                res.status(200).end();
            }
        )
    })
});

api.post("/purchase-success", (req, res) => {
    let items = req.body.details.purchase_units;
    let nowDate = new Date()
        .toLocaleString("sv", { timeZone: "Europe/Paris" })
        .slice(0, 19)
        .replace("T", " ");
    const userName = items[0].reference_id;
    const amount = items[0].amount.value;
    const email = items[0].payee.email_address;
    connection.query("INSERT INTO user_purchases_amount (amount_purchased, username) VALUES (?, ?)",
        [amount, userName],
        (err, result) => {
            if (err) throw err;
            console.log("user_purchases_amount: row created")
        });
    items[0].items.map(item => {
        connection.query("INSERT INTO purchases (username, sku, item_name, buy_date, redeemed, quantity, email) VALUES (?, ?, ?, '" + nowDate + "', 0, ?, ?)",
            [userName, item.sku, item.name, item.quantity, email],
            (err, result) => {
                if (err) throw err;
                console.log("purchases: row created!")
            });
    })
});

api.post("/get-sales-amount/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        connection.query("SELECT SUM(quantity * item_price) as total FROM `purchases` INNER JOIN `products` ON purchases.sku = products.sku WHERE buy_date = CURRENT_DATE",
            (err, result) => {
                if (err) throw err;
                res.json(result);
            })
    });
});

api.post("/get-top-customer/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        connection.query("SELECT username, MAX(amount_purchased) as total FROM user_purchases_amount WHERE amount_purchased = (SELECT MAX(amount_purchased) FROM user_purchases_amount)",
            (err, result) => {
                if (err) throw err;
                res.json(result);
            })
    });
});

api.post("/get-total-sales-amount/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        connection.query("SELECT SUM(quantity * item_price) as total FROM `purchases` INNER JOIN `products` ON purchases.sku = products.sku",
            (err, result) => {
                if (err) throw err;
                res.json(result);
            })
    });
});

api.post("/get-month-sales/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        connection.query("SELECT SUM(quantity * item_price) as total FROM `purchases` INNER JOIN `products` ON purchases.sku = products.sku WHERE MONTH(`buy_date`) = MONTH(now())",
            (err, result) => {
                if (err) throw err;
                res.json(result);
            })
    });
});

api.post("/get-all-purchases/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        connection.query("SELECT * FROM purchases",
            (err, result) => {
                if (err) throw err;
                res.json(result);
            })
    });
});

api.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username, password)
    connection.query(
        "SELECT * FROM admin WHERE username=?",
        [username],
        (error, result) => {
            let json = JSON.stringify(result);
            let user = JSON.parse(json);
            console.log(user);
            if (error) throw error;
            if (result.length < 1) {
                res.statusMessage = "Username of wachtwoord zijn onjuist.";
                res.status(500).end();
                return;
            }
            if (user[0].password !== password) {
                res.statusMessage = "Username of wachtwoord zijn onjuist.";
                res.status(500).end();
                return;
            }
            console.log("succeed")
            var token = jwt.sign(
                {
                    userId: user[0].id,
                    username: user[0].username,
                    role: 1
                },
                process.env.SECRET_KEY
            );
            res.json(token);
            res.status(200).end;
            console.log("sent 200 end")
        });
});

//Format of token
//Authorization: Bearer <access_token>
function verifyToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    //Check if not undefined
    if (typeof bearerHeader !== "undefined") {
        //Split at the spaces
        const bearer = bearerHeader.split(" ");
        //Get token from array
        const bearerToken = bearer[1];
        //Set token
        req.token = bearerToken;
        //Next middleware
        next();
    } else {
        //Forbidden
        res.sendStatus(403);
    }
}



