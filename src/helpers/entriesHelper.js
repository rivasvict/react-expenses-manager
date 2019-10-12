function getSumFromEntries(entries) {
    return entries.reduce((total, entry) => {
        total = parseInt(total);
        total += parseInt(entry.ammount);
        return total;
    }, 0);
}

function gerNegativeVersionOfEntries(entries) {
    return entries.map(entry => {
        entry.ammount = -entry.ammount;
        return entry;
    })
}

export {
    getSumFromEntries,
    gerNegativeVersionOfEntries
}