var express = require('express')
var employeesRouter = express.Router()
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.param('employeeId', (req, res, next, id) => {
    const query = 'SELECT * FROM Employee WHERE id = $employeeId';
    const values = { $employeeId: id };
    db.get(query, values, (error, employee) => {
        if (error) {
            next(error);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

employeesRouter.param('timesheetId', (req, res, next, id) => {
    const query = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
    const values = { $timesheetId: id };
    db.get(query, values, (error, timesheet) => {
        if (error) {
            next(error);
        } else if (timesheet) {
            req.timesheet = timesheet;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

//Define GET for /api/employees
employeesRouter.get('/', function (req, res, next) {
    db.all(`SELECT * 
    from Employee 
    WHERE is_current_employee = 1`,
    function(err, rows){
        if(err){
            res.sendStatus(500);
        }else{
            res.status(200).send({employees: rows});
        }
    });
});

//Define POST for /api/employees
employeesRouter.post('/', function (req, res, next) {
    const employeeToCreate = req.body.employee;
    db.run(`INSERT INTO Employee
    (name, position, wage) VALUES 
    ($name, $position, $wage)
    `,
    { 
        $name: employeeToCreate.name,
        $position: employeeToCreate.position,
        $wage: employeeToCreate.wage
    },function(err){
        if(err){
            res.sendStatus(400);
        }else{
            db.get(`SELECT * from Employee WHERE id = ${this.lastID}`, 
            function(err, row){
                if (!row) {
                    return res.sendStatus(500);
                }
                res.status(201).send({employee: row});
            });
        }
    });
});

//Define GET for /api/employees/:employeeId
employeesRouter.get('/:employeeId', function (req, res, next) {
    res.status(200).send({employee : req.employee});
});

//Define PUT for /api/employees/:employeeId
employeesRouter.put('/:employeeId', function (req, res, next) {
    const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage
    if (!name || !position || !wage) {
        return res.sendStatus(400);
    }
    const sql = `UPDATE Employee 
        SET name = $name, position = $position, wage = $wage
        WHERE id = $employeeId`;
    const values = {
        $name: name,
        $position: position,
        $wage: wage,
        $employeeId: req.params.employeeId
    };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
            (error, employee) => {
                res.status(200).send({employee: employee});
            });
        }
    });
});

//Define DELETE for /api/employees/:employeeId
employeesRouter.delete('/:employeeId', (req, res, next) => {
    const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId';
    const values = { $employeeId: req.params.employeeId };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
            (error, employee) => {
                res.status(200).send({ employee: employee });
            });
        }
    });
});

//Define GET for /api/employees/:employeeId/timesheets
employeesRouter.get('/:employeeId/timesheets', function (req, res, next) {
    db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`,
        (error, timesheets) => {
            res.status(200).send({ timesheets: timesheets });
        });
});

//Define POST for /api/employees/:employeeId/timesheets
employeesRouter.post('/:employeeId/timesheets', function (req, res, next) {
    const timesheetToCreate = req.body.timesheet;
    db.run(`INSERT INTO Timesheet
    (hours, rate, date, employee_id) VALUES 
    ($hours, $rate, $date, $employee_id)
    `,
    {
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employee_id: req.params.employeeId
    }, function (err) {
        if (err) {
            res.sendStatus(400);
        } else {
            db.get(`SELECT * from Timesheet WHERE id = ${this.lastID}`,
                function (err, row) {
                    if (!row) {
                        return res.sendStatus(500);
                    }
                    res.status(201).send({ timesheet: row });
                });
        }
    });
});

//Define PUT for /api/employees/:employeeId/timesheets/:timesheetId
employeesRouter.put('/:employeeId/timesheets/:timesheetId', function (req, res, next) {
    const hours = req.body.timesheet.hours, 
        rate = req.body.timesheet.rate, 
        date = req.body.timesheet.date,
        employee_id = req.params.employeeId,
        id = req.params.timesheetId;
    if (!hours || !rate || !date || !employee_id || !id) {
        return res.sendStatus(400);
    }
    const sql = `UPDATE Timesheet 
        SET hours = $hours, rate = $rate, date = $date
        WHERE id = $timesheetId`;
    const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $timesheetId: req.params.timesheetId
    };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`,
                (error, timesheet) => {
                    res.status(200).send({ timesheet: timesheet });
                });
        }
    });
});

//Define DELETE for /api/employees/:employeeId/timesheets/:timesheetId
employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next) => {
    const sql = 'DELETE FROM Timesheet WHERE id = $timesheetId';
    const values = { $timesheetId: req.params.timesheetId };

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});

module.exports = employeesRouter;