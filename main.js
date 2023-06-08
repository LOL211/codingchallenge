const express = require('express');
const fs = require('fs');
const gibberish = require("gibberish-detective")({useCache: true});
const app = express();
const port = process.env.PORT || 8000;
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
  
  let newticket = createticket(body);
  let dup = false;
  tickets.forEach(element => {
    if(element.tel==newticket.tel && element.msg == newticket.msg)
    {
      dup=true;
      return;
    }
  });

  if(!dup && !gibberish.detect(newticket.msg))
    tickets.push(newticket);
  else
    return [false, []];

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
    return [true, tickets];
}

app.post('/tickets', async (req, res) => {
  const { title, phoneNumber, desc, fileUrl } = req.body;
  // Validate required fields
  if (!title || !phoneNumber) {
    return res.status(400).end('Title and phone number are required');
  }
  
  let tickets;

  fs.readFile(filepath, (err, data)=>{
      if(err && !(err.code === 'ENOENT'))
      {
        res.status(500).end("Cannot access JSON file")
        return;
      }
          
      try{
        if(data && data.length>0)
          tickets = JSON.parse(data);
        else
          tickets = [];
      }
      catch(e){
        res.status(500).end("JSON file is corrupted");
        return;
      }
    let tmp = updateTickets(tickets,req.body);
    
    if(!tmp[0])
    {
      res.status(422).end("Duplicated or gibberish message");
      return;
    }
    tickets = tmp[1];
    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, JSON.stringify(tickets), (err) => {
        if (err) {
          res.status(500).end('Write failed');
          reject(err);
        } else {
          res.status(200).end('Accepted');
          resolve();
        }
      });
    });
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