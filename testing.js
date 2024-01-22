const fs = require('fs');
const path = require('path');




const file = fs.readFileSync(filePath)
const url = URL.createObjectURL(file)
console.log(url)