module.exports = function (text, arrayReplaceString) {
  for (const key in arrayReplaceString) {
    var rgx = new RegExp(key,"gi");
    text = text.replace(rgx, arrayReplaceString[key])
  }

  return text;
}