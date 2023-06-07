const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const server = require('./main.js'); // replace with the name of your server file

chai.use(chaiHttp);
const expect = chai.expect;

describe('POST /tickets', () => {
  beforeEach(() => {
 //    Delete the tickets file before each test
    try {
      fs.unlinkSync('unique.json');
    } catch (err) {
      // Ignore error if file does not exist
    }
  });

  it('should create a new ticket', (done) => {
    const ticket = {
      title: 'Test Ticket',
      phoneNumber: '123-456-7890',
      desc: 'Test Description',
      fileUrl: 'http://example.com/test-file.txt',
    };

    chai
      .request(server)
      .post('/tickets')
      .send(ticket)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.text).to.equal('Accepted');

        // Verify that the ticket was written to the file
        const data = fs.readFileSync('unique.json');
        const tickets = JSON.parse(data);
        expect(tickets).to.have.lengthOf(1);
        expect(tickets[0]).to.include({
          tel: ticket.phoneNumber,
          msg: ticket.title,
          description: ticket.desc,
          fileUrl: ticket.fileUrl,
        });
        done();
      });
  });

  it('should return an error if title is missing', (done) => {
    const ticket = {
      phoneNumber: '123-456-7890',
    };

    chai
      .request(server)
      .post('/tickets')
      .send(ticket)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Title and phone number are required');
        done();
      });
  });

  it('should return an error if phone number is missing', (done) => {
    const ticket = {
      title: 'Test Ticket',
    };

    chai
      .request(server)
      .post('/tickets')
      .send(ticket)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Title and phone number are required');
        done();
      });
  });

  it('should return an error if request body contains invalid JSON', (done) => {
    chai
      .request(server)
      .post('/tickets')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Invalid JSON data');
        done();
      });
  });


    it('should reject gibberish message', async () => {
      const res = await chai.request(server)
        .post('/tickets')
        .send({
          title: 'asdasd',
          phoneNumber: '1234567890'
        });
      expect(res).to.have.status(422);
      expect(res.text).to.equal('Duplicated or gibberish message');
    });

    it('should sort tickets by phone number and timestamp', async () => {
      // Create ticket 1
      await chai.request(server)
        .post('/tickets')
        .send({
          title: 'Hey can you throw the trash',
          phoneNumber: '1234567890'
        });
  
      // Create ticket 2
      await chai.request(server)
        .post('/tickets')
        .send({
          title: 'Hey can you throw the trash out?',
          phoneNumber: '0987654321'
        });
  
      // Create ticket 3
      await chai.request(server)
        .post('/tickets')
        .send({
          title: 'Hi I have difficult neighbours',
          phoneNumber: '1234567890'
        });
      
      // Read the JSON file and check the order of the tickets
      let data= fs.readFileSync('unique.json');
    
 
      const tickets = JSON.parse(data);
      expect(tickets[0].msg).to.equal('Hey can you throw the trash out?');
      expect(tickets[1].msg).to.equal('Hey can you throw the trash');
      expect(tickets[2].msg).to.equal('Hi I have difficult neighbours');
    });
  
    it('should reject duplicate tickets', async () => {
      // Create ticket
      await chai.request(server)
        .post('/tickets')
        .send({
          title: 'Hey I have annoying neighbours',
          phoneNumber: '1234567890'
        });
  
      // Try to create a duplicate ticket
      const res = await chai.request(server)
        .post('/tickets')
        .send({
          title: 'Hey I have annoying neighbours',
          phoneNumber: '1234567890'
        });

      
      
      // Read the JSON file and check that there is only one ticket
      const data = fs.readFileSync('unique.json');
      const tickets = JSON.parse(data);
      expect(res).to.have.status(422);
      expect(res.text).to.equal('Duplicated or gibberish message');
      expect(tickets.length).to.equal(1);
    });
  });

