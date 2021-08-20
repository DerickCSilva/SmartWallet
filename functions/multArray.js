module.exports = (item) => {
    item = item.map(v => {
        item = v.reduce((total, num) => {
            return total * num;
        });
        return item;
    });
    
    return item;
}