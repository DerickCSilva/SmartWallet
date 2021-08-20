module.exports = (money) => {
    let v = parseFloat(money);

    v = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    v = v.replace(/,/g, '.');

    let endStr = v.substr(v.length - 3);
    let startStr = v.substr(0, v.length - 3);
    
    endStr = endStr.replace('.', ',');

    let value = startStr + endStr;
    return value;
}