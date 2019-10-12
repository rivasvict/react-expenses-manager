function getSumFromEntries(entries) {
    return entries.reduce((total, entry) => {
        total = parseInt(total);
        total += parseInt(entry.ammount);
        return total;
    }, 0);
}

export {
    getSumFromEntries
}