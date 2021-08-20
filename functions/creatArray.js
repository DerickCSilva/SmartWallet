module.exports = (title, content, obj) => {
    if (obj[title] !== undefined) {  // Testa se a chave existe
        obj[title].push(content);    // Adiciona um elemento no array
    } else {
        obj[title] = [content];      // Se não existe, cria um array com o elemento
    }
}