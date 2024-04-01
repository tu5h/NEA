import express from 'express';
import cors from 'cors';
import fetch from "node-fetch";

const app = express();
app.use(express.static("public"));

app.use(cors())
app.use(express.json());

const clientID = "Ae-dmJ3R47gkBNDlbEJ4-6LP0ZhFkHuj9nzv4Z16GYzcs3YAygHLf5tv9VYUnH_m1XdOPgAzDLT4Lb62";
const secret = "EFC7T6av9l5B1i6vM-KwUzgjWk6Zw2rHdQwz2o4c9DWOagdZtQ4XdS1eyQCl-gQ7mZqfphnvStv5yWUC";

const prices = {
    'badminton': '12.00',
    'tennis': '15.00',
    'table tennis': '12.00',
    'swimming': '5.00',
    'yoga class': '18.00',
    'gym training': '10.00',
    'meditation workshop': '20.00'
  };  

  app.listen(5555, function(err){
    if (err) console.log(err);
    console.log('Server listening on http://localhost:5555');
});

app.get("/", (req, res) => {
    res.json("Hello");
});


app.get('/payments/:sport', (req, res) => {
    const { sport } = req.params;
    const price = prices[sport];
    if (price) {
      res.redirect(`/index.html?price=${price}`);
    } else {
      res.status(404).send('Sport not found');
    }
});

app.get('/payment/successful', async (req, res) => {
    // Notify the C# listener about the success
    await fetch('http://localhost:8081/payment/successful');
    res.send("Payment Successful. You can close this window.");
});

app.get('/payment/failure', async (req, res) => {
    // Notify the C# listener about the failure
    await fetch('http://localhost:8081/payment/failure');
    res.send("Payment Failed. Please try again or contact support.");
});


// making API call to PayPal servers to create order
app.post("/create-order", async (req, res) =>{
    const { price } = req.body;   
    const auth = await generateAccessToken();
    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders`, {
        method: "post",
        headers: { 
            'Content-Type' : 'application/json',
            Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                amount: {
                    currency_code: "GBP",
                    value: price
                },
            }],
        }),
    });
    const data = await response.json();
    res.json(data);
});


// making API call to PayPal servers to capture order
app.post("/capture-order", async (req, res) =>{
    const { orderID } = req.params;
    const auth = await generateAccessToken();
    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`,
        }
    });
    res.json(response.json());
})

// generate authorization token

async function generateAccessToken() {
    const auth = Buffer.from(clientID + ":" + secret).toString("base64");
    const response = await fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const jsonData = await response.json();
    return jsonData.access_token;
  }