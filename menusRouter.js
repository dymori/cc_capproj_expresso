var express = require('express')
var menusRouter = express.Router()
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('menuId', (req, res, next, id) => {
    const query = 'SELECT * FROM Menu WHERE id = $menuId';
    const values = { $menuId: id };
    db.get(query, values, (error, menu) => {
        if (error) {
            next(error);
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

menusRouter.param('menuItemId', (req, res, next, id) => {
    const query = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
    const values = { $menuItemId: id };
    db.get(query, values, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            req.menuItem = menuItem;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

//Define GET for /api/menus
menusRouter.get('/', function (req, res, next) {
    db.all(`SELECT * 
    from Menu`,
        function (err, rows) {
            if (err) {
                res.sendStatus(500);
            } else {
                res.status(200).send({ menus: rows });
            }
        });
});

//Define POST for /api/menus
menusRouter.post('/', function (req, res, next) {
    const menuToCreate = req.body.menu;
    db.run(`INSERT INTO Menu
    (title) VALUES 
    ($title)
    `,
    {
        $title: menuToCreate.title
    }, function (err) {
        if (err) {
            res.sendStatus(400);
        } else {
            db.get(`SELECT * from Menu WHERE id = ${this.lastID}`,
                function (err, row) {
                    if (!row) {
                        return res.sendStatus(500);
                    }
                    res.status(201).send({ menu: row });
                });
        }
    });
});

//Define GET for /api/menus/:menuId
menusRouter.get('/:menuId', function (req, res, next) {
    res.status(200).send({ menu: req.menu });
});

//Define PUT for /api/menus/:menuId
menusRouter.put('/:menuId', function (req, res, next) {
    const title = req.body.menu.title
    if (!title) {
        return res.sendStatus(400);
    }
    const sql = `UPDATE Menu 
        SET title = $title
        WHERE id = $menuId`;
    const values = {
        $title: title,
        $menuId: req.params.menuId
    };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`,
                (error, menu) => {
                    res.status(200).send({ menu: menu });
                });
        }
    });
});

//Define DELETE for /api/menus/:menuId
menusRouter.delete('/:menuId', (req, res, next) => {
    const sql = `DELETE from Menu 
            WHERE id = $menuId 
            AND (
                SELECT Count() 
                from MenuItem 
                where menu_id = $menuId
            ) = 0`
    const values = { $menuId: req.params.menuId };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row)=>{
                if (row) {
                    res.status(400).send();
                }else{
                    res.status(204).send();
                }
            });
        }
    });
});

//Define GET for /api/menus/:menuId/menu-items
menusRouter.get('/:menuId/menu-items', function (req, res, next) {
    db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`,
        (error, menuItem) => {
            // console.log(menuItem);
            res.status(200).send({ menuItems: menuItem });
        });
});

//Define POST for /api/menus/:menuId/menu-items
menusRouter.post('/:menuId/menu-items', function (req, res, next) {
    const menuItemToCreate = req.body.menuItem;
    db.run(`INSERT INTO MenuItem
    (name, description, inventory, price, menu_id) VALUES 
    ($name, $description, $inventory, $price, $menu_id)
    `,
        {
            $name: menuItemToCreate.name,
            $description: menuItemToCreate.description,
            $inventory: menuItemToCreate.inventory,
            $price: menuItemToCreate.price,
            $menu_id: req.params.menuId
        }, function (err) {
            if (err) {
                res.sendStatus(400);
            } else {
                db.get(`SELECT * from MenuItem WHERE id = ${this.lastID}`,
                    function (err, row) {
                        if (!row) {
                            return res.sendStatus(500);
                        }
                        res.status(201).send({ menuItem: row });
                    });
            }
        });
});

//Define PUT for /api/menus/:menuId/menu-items/:menuItemId
menusRouter.put('/:menuId/menu-items/:menuItemId', function (req, res, next) {
    const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price,
        id = req.params.menuItemId;
    if (!name || !description || !inventory || !price || !id) {
        return res.sendStatus(400);
    }
    const sql = `UPDATE MenuItem 
        SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id
        WHERE id = $menuItemId`;
    const values = {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menu_id: req.params.menuId,
        $menuItemId: req.params.menuItemId
    };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`,
                (error, menuItem) => {
                    res.status(200).send({ menuItem: menuItem });
                });
        }
    });
});

//Define DELETE for /api/employees/:menuId/menu-items/:menuItemId
menusRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) => {
    const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
    const values = { $menuItemId: req.params.menuItemId };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});

module.exports = menusRouter;