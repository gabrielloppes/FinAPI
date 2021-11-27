const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

// Middleware
verifyIfAccountExists = (request, response, next) => {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Cliente não encontrado" })
  }

  request.customer = customer;

  return next();
}

getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

// HTTP Methods

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Já existe um cadastro com esse CPF, por favor, cadastre um novo" })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).json({ message: "Cadastro criado com sucesso" })
});

app.get("/statement", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement)
});

app.post("/deposit", verifyIfAccountExists, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Saldo insuficiente" })
  };

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const formatDate = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(formatDate).toDateString())

  return response.json(statement)
});

app.put("/account", verifyIfAccountExists, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  return response.status(201).send()
});

app.get("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  return response.json(customer);
})

app.listen(3333);
