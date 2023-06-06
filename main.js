const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;
const filepath = "unique.json";
app.use(express.json());


const createticket = (requestBody)=>{
    const d = new Date();
    let tmp = Object();
        let isoDateStamp = d.toISOString();
        tmp.createdAt = isoDateStamp;
        tmp.tel = requestBody.phoneNumber;
        tmp.msg = requestBody.title;
        
        if(requestBody.desc) tmp.description = requestBody.desc;
        if(requestBody.fileUrl) tmp.fileUrl = requestBody.fileUrl;
    return tmp;
}

const updateTickets = (tickets, body)=>{
  
  tickets.push(createticket(body));
  
  


  tickets.sort((a, b) => {
    if (a.tel < b.tel) {
      return -1;
    } else if (a.tel > b.tel) {
      return 1;
    } else {
      // Phone numbers are equal, sort by timestamp
      if (a.createdAt < b.createdAt) {
        return -1;
      } else if (a.createdAt > b.createdAt) {
        return 1;
      } else {
        return 0;
      }
    }
  });
    return tickets;
}

app.post('/tickets', async (req, res) => {
  const { title, phoneNumber, desc, fileUrl } = req.body;
  //console.log(req.body);
  // Validate required fields
  if (!title || !phoneNumber) {
    return res.status(400).end('Title and phone number are required');
  }
  
  let tickets;

//Method 1
    // try{
    //     let data = fs.readFileSync(filepath);
    //     tickets = JSON.parse(data);
    // }
    // catch(e){
    //     if(e.code === 'ENOENT')
    //         tickets = [];
    //     else res.status(500).end("Cannot read JSON file");
    // }
    // tickets = writetickets(tickets,req.body);
    // fs.writeFile(filepath, JSON.stringify(tickets), (err)=>{
    //   res.status(500).end("Write failed");
    // })
    // res.status(200).end("Accepted")
   

//Method 2
  fs.readFile(filepath, (err, data)=>{
      if(err && !(err.code === 'ENOENT'))
          res.status(500).end("Cannot access JSON file")
      
      try{
        if(data){
          tickets = JSON.parse(data);
        }
        else
        tickets = [];
      }
      catch(e){
        res.status(500).end("JSON file is corrupted");
      }
    tickets = updateTickets(tickets,req.body);
    fs.writeFile(filepath, JSON.stringify(tickets), (err)=>{
      res.status(500).end("Write failed");
    })
    res.status(200).end("Accepted")
});

});




// Error-handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Invalid JSON data in request body
    return res.status(400).send('Invalid JSON data');
  }
  next();
});

let server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


module.exports = server