const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
//Assigning express package to api variable.
const api = express();
//Establishing a mysql connection.
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "fiddle_store",
});

api.use(cors());
//Setting up body parser to support json data.
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));

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

api.get("/get-products/:id", (req, res) => {
    connection.query("SELECT * FROM products WHERE product_categorie = ?", [req.params.id], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

api.post("/purchase-success", (req, res) => {
    let items = req.body.details.purchase_units;
    let nowDate = new Date()
        .toLocaleString("sv", { timeZone: "Europe/Paris" })
        .slice(0, 19)
        .replace("T", " ");
    const userName = items[0].reference_id;
    const email = items[0].payee.email_address;
    items[0].items.map(item => {
        connection.query("INSERT INTO purchases (username, sku, item_name, buy_date, redeemed, quantity, email) VALUES (?, ?, ?, '" + nowDate + "', 0, ?, ?)",
            [userName, item.sku, item.name, item.quantity, email],
            (err, result) => {
                if (err) throw err;
                console.log("Row created!")
            });
    })


});