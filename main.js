// Import required modules
const express = require('express');
const fs = require('fs');
const gibberish = require("gibberish-detective")({useCache: true});

// Create an Express app
const app = express();

// Set the port to use the environment variable or default to 8000
const port = process.env.PORT || 8000; 

// Set the filepath for the JSON file
const filepath = "unique.json"; 

// Use the express.json middleware to parse JSON request bodies
app.use(express.json());

// Function to create a ticket object from a request body
const createticket = (requestBody)=>{
    const d = new Date();
    let tmp = Object();
    let isoDateStamp = d.toISOString();
    tmp.createdAt = isoDateStamp;
    tmp.tel = requestBody.phoneNumber;
    tmp.msg = requestBody.title;
    
    // Add optional fields if they exist in the request body
    if(requestBody.desc) tmp.description = requestBody.desc;
    if(requestBody.fileUrl) tmp.fileUrl = requestBody.fileUrl;
    return tmp;
}

// Function to update the tickets array with a new ticket from the request body
const updateTickets = (tickets, body)=>{
  
  // Create a new ticket from the request body
  let newTicket = createticket(body);
  let isDuplicate = false;

  // Check for duplicates
  tickets.forEach(element => {
    if(element.tel==newTicket.tel && element.msg == newTicket.msg)
    {
      isDuplicate=true;
      return;
    }
    else if(element.tel>newTicket.tel)  // since the array is sorted by phone numbers
    {
      return;
    }
  });
  
  // If not a duplicate and not gibberish, add the new ticket to the array
  if(!isDuplicate && !gibberish.detect(newTicket.msg))
    tickets.push(newTicket);
  else
    return [false, []]; //return false to not update array

  // Sort the tickets array by phone number and timestamp as the example conversation.json
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

// POST route for creating a new ticket
app.post('/tickets', async (req, res) => {
  const { title, phoneNumber, desc, fileUrl } = req.body;

  // Validate required fields
  if (!title || !phoneNumber) {
    return res.status(400).end('Title and phone number are required');
  }
  
  let tickets;

  // Read the JSON file
  fs.readFile(filepath, (err, data)=>{
      if(err && !(err.code === 'ENOENT'))
      {
        res.status(500).end("Cannot access JSON file")
        return;
      }
          
      try{
        // Parse the data from the file or create an empty array if no data
        if(data && data.length>0)
          tickets = JSON.parse(data);
        else
          tickets = [];
      }
      catch(e){
        res.status(500).end("JSON file is corrupted");
        return;
      }

    // Update the tickets array with the new ticket from the request body
    let tmp = updateTickets(tickets,req.body);
    
    // If duplicate or gibberish message, return error response
    if(!tmp[0])
    {
      res.status(422).end("Duplicated or gibberish message");
      return;
    }
    
    // Update the tickets array with the new ticket data
    tickets = tmp[1];

    // Write the updated tickets array to the JSON file and send response once completed.
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

app.get('/download', (req, res) => {
  const file = __dirname+'/'+filepath;
  res.download(file)
});
// Error-handling middleware for invalid JSON data in request body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Invalid JSON data in request body
    return res.status(400).send('Invalid JSON data');
  }
  next();
});

// Start listening on the specified port
let server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});



//This was built according to the best understanding of requirements
//assumptions - 
//grouping of messaging was not required according to the email, only a gibberish and duplicate check was used.5
//The API is not responsible for fixing the JSON file if it is corrupted and assume it must be manually checked
//Nothing else is accessing the json file and requests will just be handled concurrently
// logging capabilities are not added here since it wasn't a request
// Security was also assumed to not be a requirement and wasn't considered

//Additionally chat gpt request could be made to predictor for gibberish a custom ML model like naive bayes 
//or help it automatically create group of messages as one ticket


//Alternatively, the reading and writing could be done with ReadFileSync and etc.. to design a simpler synchronous structure since async
//isn't needed according to the assumptions and requirements
//Sample test cases are in test.js file

//additionally, a download get request can be done to download the json file

// Export the server for testing
module.exports = server
