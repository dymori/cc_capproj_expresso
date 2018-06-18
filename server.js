const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const EmployeesRouter = require('./employeesRouter.js');
const MenusRouter = require('./menusRouter.js');

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(cors());

app.use('/api/employees', cors({ origin: false }), EmployeesRouter);
app.use('/api/menus', cors({ origin: false }), MenusRouter);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

module.exports = app;