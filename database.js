const mongoose = require('mongoose')

function connectDatabase(conStr){
    mongoose.connect(conStr);

    const db = mongoose.connection;

    db.on('error',(err)=>{
        console.error("Database Connection Error : ",err)
    })

    db.once('open',()=> {
        console.log("Database Conected Successfully")
    })
}

module.exports = connectDatabase;