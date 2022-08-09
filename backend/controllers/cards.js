/* eslint-disable max-len */
const Card = require('../models/cardSchema');

const ValueError = require('../errors/value-error');
const NotFoundError = require('../errors/not-found-error');
const ForbiddenError = require('../errors/forbidden-error');

// Создает карточку
module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({
    name,
    link,
    likes: [],
    owner: req.user._id,
  })
    .then((newCard) => {
      res.send(newCard);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValueError(err.message));
      } else {
        next(err);
      }
    });
};

// Получает список карточек
module.exports.getCards = (req, res, next) => {
  Card.find({})
    .populate('owner')
    .then((cards) => {
      res.send(cards);
    })
    .catch(next);
};

// Удаляет карточку
module.exports.deleteCard = (req, res, next) => {
  const { id } = req.params;
  Card.findById(id)
    .orFail(() => {
      throw new NotFoundError('Карточка по указанному id не найдена');
    })
    .then((card) => {
      if (!card.owner.equals(req.user._id)) {
        throw new ForbiddenError('Нельзя удалить чужую карточку');
      }
      return card.remove()
        .then(() => res.send({ message: 'Карточка успешно удалилась' }));
    })
    .catch(next);
};

// Ставит лайк карточке
module.exports.setLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    {
      $addToSet: {
        likes: req.user._id,
      },
    },
    { new: true },
  )
    .then((newCard) => {
      if (!newCard) {
        throw new NotFoundError('Передан несуществующий _id карточки');
      }
      res.send(newCard);
    })
    .catch(next);
};

// Убирает лайк у карточки
module.exports.removeLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    {
      $pull: {
        likes: req.user._id,
      },
    },
    { new: true },
  )
    .then((newCard) => {
      if (!newCard) {
        throw new NotFoundError('Передан несуществующий id карточки');
      }

      res.send(newCard);
    })
    .catch(next);
};
