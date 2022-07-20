/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const { default: mongoose } = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
// const cors = require('cors');
const { cors } = require('./utils/cors');
const userRouter = require('./routes/users');
const cardRouter = require('./routes/cards');
const loginRouter = require('./routes/login');
const NotFoundError = require('./errors/not-found-error');
const { auth } = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');
// const { allowedUrls } = require('./utils/allowedUrls');

const { PORT = 3000 } = process.env;

const app = express();

async function mongoInit() {
  await mongoose.connect('mongodb://localhost:27017/mestodb');
}

// app.use(cors({
//   origin: allowedUrls,
//   credentials: true,
// }));

app.use(cors);

mongoInit().catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.use('/', loginRouter);
app.use('/', userRouter);
app.use('/', cardRouter);

app.use(errorLogger);

app.use(auth, (req, res, next) => {
  next(new NotFoundError('Путь не найден'));
});

app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).send({
    message: statusCode === 500
      ? 'На сервере произошла ошибка'
      : message,
  });
  next();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
