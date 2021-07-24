var mongo = require("./src/mongo");
return new Promise(async(resolve,reject)=>{
    var db = await new mongo({MONGO_USERNAME: "junior"}).ready();
    var dados = await db.collection("minhacollection").find().toArray();
    console.log(dados);
});