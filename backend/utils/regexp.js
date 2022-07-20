/* eslint-disable no-useless-escape */
/* eslint-disable prefer-regex-literals */
const linkRegExp = new RegExp(/(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$#?/);
module.exports = linkRegExp;
