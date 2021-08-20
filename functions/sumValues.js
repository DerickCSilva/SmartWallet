module.exports = (array) => {
    array = array.reduce((total, num) => {
        return total + num;
    });

    array = parseFloat(array.toFixed(2))

    return array;
}