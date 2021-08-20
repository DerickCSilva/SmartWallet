module.exports = (record) => {
    let total = record.map(t => {
        t = t.replace(',', '.');
        t = parseFloat(t);
        return t;
    });

    if (total.length > 0) {
        total = total.reduce((total, num) => {
            return total + num;
        });
    }

    return total;
}