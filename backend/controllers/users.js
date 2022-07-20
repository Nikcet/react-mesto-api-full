const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const AuthError = require('../errors/authorization-error');
const ValueError = require('../errors/value-error');
const NotFoundError = require('../errors/not-found-error');
const BadRequestError = require('../errors/bad-request-error');

// Создание пользователя
module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => {
      User.findUserByEmail(email)
        .then((user) => {
          if (user) {
            throw new BadRequestError('Такой пользователь уже существует');
          } else {
            User.create({
              name, about, avatar, email, password: hash,
            })
              .then((newUser) => {
                if (!newUser) {
                  throw new ValueError('Переданы некорректные данные при создании пользователя');
                }
                res.send({
                  data: {
                    name, about, avatar, email,
                  },
                });
              })
              .catch(next);
          }
        })
        .catch(next);
    })
    .catch((err) => {
      next(err);
    });
};

// Получение списка пользователей
module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => {
      res.send({ usersList: users });
    })
    .catch((err) => {
      next(err);
    });
};

// Получение пользователя по id
module.exports.getUser = (req, res, next) => {
  const findUser = (id) => {
    User.findById(id)
      .then((user) => {
        if (!user) {
          throw new NotFoundError('Пользователь с таким id не найден');
        }
        res.send({ user });
      })
      .catch((err) => {
        if (err.name === 'CastError') {
          next(new ValueError(err.message));
        } else {
          next(err);
        }
      });
  };
  if (req.params.id !== 'me' && req.params.id !== undefined) {
    findUser(req.params.id);
  } else {
    findUser(req.user._id);
  }
};

// Обновление профиля
module.exports.updateProfile = (req, res, next) => {
  const {
    name = req.params.name,
    about = req.params.about,
  } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    {
      name, about,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному id не найден');
      }
      res.send({
        name: user.name, about: user.about,
      });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValueError('Переданы некорректные данные при обновлении данных пользователя'));
      } else {
        next(err);
      }
    });
};

// Обновление аватара
module.exports.updateAvatar = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((user) => {
      if (!user.avatar) {
        throw new NotFoundError('Пользователь не найден');
      }
      return res.send({ avatar: user.avatar });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValueError('Переданы некорректные данные при обновлении данных пользователя'));
      } else {
        next(err);
      }
    });
};

// Авторизация
module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const { NODE_ENV, JWT_SECRET } = process.env;
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );

      if (!token) {
        throw new AuthError('Не удалось авторизоваться');
      }
      res
        .cookie(
          'jwt',
          token,
          {
            maxAge: 3600000 * 24 * 7,
            httpOnly: true,
            sameSite: 'None',
            secure: true,
          },
        );
      res.send({ token });
    })
    .catch(next);
};
