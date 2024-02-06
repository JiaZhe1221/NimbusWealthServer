const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();
const port = 8082;

app.use(bodyParser.json()); // Middleware to parse JSON

// Middleware to handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');  // use https://jiazhe1221.github.io when website is live on github use http://localhost:1111 for local host
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Connection URI
const uri = 'mongodb+srv://user123:SkyStudios5757@skystudios.rjfe3hg.mongodb.net/NimbusWealth';

// Connect to the MongoDB server
MongoClient.connect(uri, (err, client) => {
    if (err) throw err;

    // Access the databases
    const db = client.db('NimbusWealth');

    // Access the users collection
    const usersCollection = db.collection('testing');

    // Registration endpoint
    app.post('/signup', async (req, res) => {
        const { username, emailaddress, password } = req.body;

        try {
            // Check if the username or email already exists in the database
            const existingUser = await usersCollection.findOne({
                $or: [
                    { username: username },
                    { email: emailaddress },
                ],
            });

            if (existingUser) {
                const existingField = existingUser.username === username ? 'Username' : 'Email';
                return res.status(400).json({ success: false, message: `${existingField} already exists` });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Replace the plain text password with the hashed password
            const userData = {
                username: username,
                email: emailaddress, // Fix variable name here
                password: hashedPassword,
                stockCurrency: 1000,
                return: 0,
            };

            // Insert user data
            await usersCollection.insertOne(userData);

            res.status(200).json({ success: true, message: 'User registered successfully' });
          } catch (error) {
              console.error('Error processing registration:', error);
              res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
          }
      });

    // Login endpoint
    app.post('/signin', async (req, res) => {
      const { username, password } = req.body;
  
      try {
          // Check if the user exists in the database
          const existingUser = await usersCollection.findOne({ username: username });
  
          if (!existingUser) {
              return res.status(400).json({ success: false, message: 'User not found' });
          }
  
          // Compare the provided password with the hashed password in the database
          const passwordMatch = await bcrypt.compare(password, existingUser.password);
  
          if (!passwordMatch) {
              return res.status(401).json({ success: false, message: 'Invalid password' });
          }
  
          // If username and password are valid, you can consider the user authenticated
          // Send the user data along with the success response
          res.status(200).json({ success: true, message: 'Login successful', userData: existingUser });
      } catch (error) {
          console.error('Error processing login:', error);
          res.status(500).json({ success: false, message: 'Error processing login' });
      }
    });

    // Endpoint to get user data based on userId
    app.get('/getUserData', async (req, res) => {
      const userId = req.query.userId;
    
      try {
        // Find the user with the specified userId
        const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      
        if (!user) {
          // If the user does not exist, send an error response
          return res.status(404).json({ error: 'User not found.' });
        }
      
        // Send the user data in the response
        res.status(200).json({ user });
      } catch (error) {
        // Send an error response with details
        res.status(500).json({ error: 'Internal server error.', details: error.message });
      }
    });

    // Check username endpoint
    app.post('/checkUsername', async (req, res) => {
      try {
          const { newUsername } = req.body;
      
          // Check if the new username already exists in the database
          const existingUser = await usersCollection.findOne({ username: newUsername });
      
          if (existingUser) {
              res.status(200).json({ success: false, message: 'Username already exists' });
          } else {
              res.status(200).json({ success: true, message: 'Username is unique' });
          }
      } catch (error) {
          console.error('Error checking username:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Update username endpoint
    app.post('/updateUsername', async (req, res) => {
      try {
          const { userId, newUsername } = req.body;
  
          // Convert userId to ObjectId
          const objectId = new ObjectId(userId);
  
          // Update the username in the database
          const result = await usersCollection.updateOne({ _id: objectId }, { $set: { username: newUsername } });
          if (result.modifiedCount > 0) {
              // Username updated successfully
              res.status(200).json({ success: true, message: 'Username updated successfully' });
          } else {
              // No matching user found
              res.status(404).json({ success: false, message: 'User not found' });
          }
      } catch (error) {
          console.error('Error updating username:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Check old password endpoint
    app.post('/checkOldPassword', async (req, res) => {
      try {
          // Extract necessary information from the request body
          const { userId, oldPassword } = req.body;
          const objectId = new ObjectId(userId);
      
          // Retrieve the user's hashed password from the database based on the username
          const user = await usersCollection.findOne({ _id: objectId });
      
          if (!user) {
              return res.status(400).json({ success: false, message: 'User not found' });
          }
        
          // Compare the entered old password with the stored hashed password
          const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        
          if (!passwordMatch) {
              return res.status(401).json({ success: false, message: 'Incorrect old password' });
          }
        
          // Password is correct
          res.status(200).json({ success: true, message: 'Old password is correct' });
      } catch (error) {
          console.error('Error checking old password:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });
    
    // Update password endpoint
    app.post('/updatePassword', async (req, res) => {
      try {
          // Extract necessary information from the request body
          const { _id, newPassword } = req.body;
          const objectId = new ObjectId(_id);
          
          // Hash the password
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update the user's password in the database
          await usersCollection.updateOne({ _id: objectId }, { $set: { password: hashedPassword } });
          res.status(200).json({ success: true, message: 'Password updated successfully' });
      } catch (error) {
          console.error('Error updating password:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Check if email exists endpoint
    app.post('/checkEmailExistence', async (req, res) => {
      try {
          const { email } = req.body;
      
          // Check if the email already exists in the database
          const existingEmail = await usersCollection.findOne({ email: email });
      
          if (existingEmail) {
              return res.status(400).json({ success: false, message: 'Email already exists' });
          }
        
          // Email is unique
          res.status(200).json({ success: true, message: 'Email is unique' });
      } catch (error) {
          console.error('Error checking email existence:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Update email endpoint
    app.post('/updateEmail', async (req, res) => {
      try {
          const { userId, newEmail } = req.body;
      
          // Update the email in the database
          const result = await usersCollection.updateOne({ _id: ObjectId(userId) }, { $set: { email: newEmail } });
      
          if (result.modifiedCount > 0) {
              // Email updated successfully
              res.status(200).json({ success: true, message: 'Email updated successfully' });
          } else {
              // No matching user found
              res.status(404).json({ success: false, message: 'User not found' });
          }
      } catch (error) {
          console.error('Error updating email:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Update birthdate endpoint
    app.post('/updateBirthdate', async (req, res) => {
      try {
          const { userId, newBirthdate } = req.body;
      
          // Convert userId to ObjectId
          const objectId = new ObjectId(userId);
      
          // Update the birthdate in the database
          const result = await usersCollection.updateOne(
              { _id: objectId },
              { $set: { birthdate: newBirthdate } }
          );
          
          if (result.modifiedCount > 0) {
              // Birthdate updated successfully
              res.status(200).json({ success: true, message: 'Birthdate updated successfully' });
          } else {
              // No matching user found
              res.status(404).json({ success: false, message: 'User not found' });
          }
      } catch (error) {
          console.error('Error updating birthdate:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Update currency endpoint
    app.post('/updateCurrency', async (req, res) => {
      try {
          const { userId, newCurrency } = req.body;
      
          // Convert userId to ObjectId
          const objectId = new ObjectId(userId);
      
          // Update the currency in the database
          const result = await usersCollection.updateOne(
              { _id: objectId },
              { $set: { currency: newCurrency } }
          );
          
          if (result.modifiedCount > 0) {
              // Currency updated successfully
              res.status(200).json({ success: true, message: 'Currency updated successfully' });
          } else {
              // No matching user found
              res.status(404).json({ success: false, message: 'User not found' });
          }
      } catch (error) {
          console.error('Error updating currency:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
      }
    });

    // Add Wallet End Point
    app.post('/addWalletItem', async (req, res) => {
      const { userId, name, type, currency, amount } = req.body;
    
      try {      
        // Check if the user with the specified userId exists
        const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      
        if (!user) {
          // If the user does not exist, send an error response
          return res.status(400).json({ error: 'User not found.' });
        }
        // Check if the name already exists in the wallet items
        const existingItem = user.walletItems && user.walletItems.find(item => item.name === name);
      
        if (existingItem) {
          // If the item already exists, send an error response
          return res.status(401).json({ error: 'Wallet item with this name already exists for the user.' });
        }
      
        // Create a new wallet item
        const newWalletItem = {
          name,
          type,
          currency,
          amount
        };
      
        // Update the user document by adding the new wallet item
        await usersCollection.updateOne(
          { _id: ObjectId(userId) },
          { $push: { walletItems: newWalletItem } }
        );
        
        // Send a success response
        res.status(200).json({ success: 'Wallet item added successfully.' });
      } catch (error) {
        // Send an error response with details
        res.status(500).json({ error: 'Internal server error.', details: error.message });
      }
    });

    // Add Transaction endpoint
    app.post('/submitTransaction', async (req, res) => {
        const { userId, account, type, amount, currency, notes, transactionDateTime, ...additionalFields } = req.body;
      
        try {
          // Check if the user with the specified userId exists
          const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      
          if (!user) {
            // If the user does not exist, send an error response
            return res.status(400).json({ error: 'User not found.' });
          }
      
          // Create a new transaction object
          const newTransaction = {
            account,
            type,
            amount,
            currency,
            notes,
            transactionDateTime,
            ...additionalFields,
          };
          
          if (type === 'income') {

            // Add the amount from the specified account
            const updatedWalletItems = user.walletItems.map(walletItem => {
                if (walletItem.name === account) {
                  const updatedAmount = walletItem.amount + parseFloat(amount);
                  return { ...walletItem, amount: updatedAmount };
                }
                return walletItem;
              });
        
              // Update the user document with the updated wallet items and add the new income transaction
              await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                  $set: { walletItems: updatedWalletItems },
                  $push: { transactionHistory: newTransaction },
                }
              );

              return res.status(200).json({ success: 'Transaction added successfully.' });

          } else if (type === 'expenses') {
            // Deduct the amount from the specified account
            const updatedWalletItems = user.walletItems.map(walletItem => {
              if (walletItem.name === account) {
                const updatedAmount = walletItem.amount - amount;
                return { ...walletItem, amount: updatedAmount };
              }
              return walletItem;
            });
            
            // Update the user document with the updated wallet items and add the new expense transaction
            await usersCollection.updateOne(
              { _id: ObjectId(userId) },
              {
                $set: { walletItems: updatedWalletItems },
                $push: { transactionHistory: newTransaction },
              }
            );

            return res.status(200).json({ success: 'Transaction added successfully.' });

          } else if (type === 'transfer') {
            // Convert amount to a numeric type
            const numericAmount = parseFloat(amount);
            const numericAmountReceive = parseFloat(amountInReceiveCurrency);
        
            // Find the index of the payment account in walletItems
            const paymentAccountIndex = user.walletItems.findIndex(walletItem => walletItem.name === additionalFields.paymentAccount);
        
            // Find the index of the receive account in walletItems
            const receiveAccountIndex = user.walletItems.findIndex(walletItem => walletItem.name === additionalFields.receiveAccount);
        
            // Validate that the payment and receive accounts are different
            if (paymentAccountIndex === receiveAccountIndex) {
                return res.status(400).json({ error: 'Payment and receive accounts must be different.' });
            }
        
            // Deduct the amount from the payment account
            user.walletItems[paymentAccountIndex].amount -= numericAmount;
        
            // Add the amount to the receive account
            user.walletItems[receiveAccountIndex].amount += numericAmountReceive;
        
            // Update the user document with the updated wallet items and add the new transfer transaction
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $set: { walletItems: user.walletItems },
                    $push: { transactionHistory: newTransaction },
                }
            );
        
            // Send a success response
            return res.status(200).json({ success: 'Transaction added successfully.' });
        }
        } catch (error) {
          // Send an error response with details
          res.status(500).json({ error: 'Internal server error.', details: error.message });
        }
    });
    
    // Endpoint to handle stock purchases
    app.post('/buyStocks', async (req, res) => {
        const { userId, stockSymbol, sharesToBuy, stockPrice } = req.body;
        try {
            // Check if the user with the specified userId exists
            const user = await usersCollection.findOne({ _id: ObjectId(userId) });
        
            if (!user) {
                // If the user does not exist, send an error response
                return res.status(400).json({ error: 'User not found.' });
            }
        
            
            // Calculate the total cost of the stocks
            const totalCost = parseFloat((stockPrice * sharesToBuy).toFixed(2));
            let stockCurrency = user.stockCurrency;

            if (!stockCurrency) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { stockCurrency: 1000 }
                    }
                );
            }
            // Check if the user has enough funds in yourCurrency wallet
            if (!stockCurrency || stockCurrency < totalCost) {
                return res.status(400).json({ error: 'Insufficient funds.' });
            }

        
            // Deduct the total cost from the yourCurrency wallet
            stockCurrency -= totalCost;
        
            // Update the user document with the updated stockCurrency
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $set: { 'stockCurrency': stockCurrency },
                }
            );

            const totalReturn = user.return;
            
            if (!totalReturn) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { return: 0 }
                    }
                );
            }
            
            // Check if the user has buyStocks array
            const buyStocksArray = user.buyStocks;
            const stockValue = parseFloat(user.stockValue);
            
            const unrealizedReturn = user.UnReturn;

            if (!unrealizedReturn) {
                // If user does not have it, create one
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { UnReturn: {} }
                    }
                );
            } 
            

            if (!buyStocksArray) {
                // If the user does not have a buyStocks array, create one
                await usersCollection.updateOne(
                    { _id: ObjectId(userId) },
                    {
                        $set: { buyStocks: [] } // Create an empty array
                    }
                );
            }
        
            // Check if the user has a stockValue array
            if (!user.stockValue) {
                // If the user does not have a stockValue array, create one
                await usersCollection.updateOne(
                    { _id: ObjectId(userId) },
                    {
                        $set: { stockValue: 0 } // Initialize with zero
                    }
                );
            }
        
            // Calculate stock value for the current purchase
            const stockValueForCurrentPurchase = sharesToBuy * stockPrice;
            const newStockValue = stockValueForCurrentPurchase + parseFloat(stockValue || 0);
        
            // Add the stock purchase information to the user's buyStocks array
            const newStockPurchase = {
                totalCost,
                stockSymbol,
                sharesToBuy,
                stockPrice,
                stockValue: stockValueForCurrentPurchase, // Store the stock value for the current purchase
                transactionDateTime: new Date(),
            };
        
            // Update the user document with the stock purchase information
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $push: { buyStocks: newStockPurchase },
                }
            );
            
            // Update the user document with the stock value for the current purchase
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $set: { stockValue: newStockValue },
                }
            );
            

            // Fetch stocksOwn from the user document
            const stocksOwn = user.stocksOwn || [];

            // Find the index of the stock with the given symbol in stocksOwn
            const existingStockIndex = stocksOwn.findIndex(stock => stock.symbol === stockSymbol);
            const avgCost = (stockPrice * sharesToBuy) / sharesToBuy;


            if (existingStockIndex === -1) {
                // If the stock doesn't exist, create a new entry
                stocksOwn.push({
                    symbol: stockSymbol,
                    shares: sharesToBuy,
                    totalCost: stockPrice * sharesToBuy,
                    avgCost: avgCost, // Assuming stockPrice is the cost per share
                });
            } else {
                // If the stock exists, update the shares and total cost
                stocksOwn[existingStockIndex].shares += sharesToBuy;
                stocksOwn[existingStockIndex].totalCost += stockPrice * sharesToBuy;
                stocksOwn[existingStockIndex].avgCost = stocksOwn[existingStockIndex].totalCost / stocksOwn[existingStockIndex].shares;
            }

            // Update the user document with the modified stocksOwn
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $set: { stocksOwn }
                }
            );
        
            // Send a success response
            return res.status(200).json({ success: 'Stocks bought successfully.' });
        } catch (error) {
            // Send an error response with details
            console.log(error)
            res.status(500).json({ error: 'Internal server error.', details: error.message });
        }
    });
    
    // Endpoint to handle stock sales
    app.post('/sellStocks', async (req, res) => {
        const { userId, stockSymbol, sharesToSell, stockPrice } = req.body;

        try {
            // Check if the user with the specified userId exists
            const user = await usersCollection.findOne({ _id: ObjectId(userId) });

            if (!user) {
                // If the user does not exist, send an error response
                return res.status(400).json({ error: 'User not found.' });
            }

            // Extract stocksOwn from the user document or initialize an empty array
            let stocksOwn = user.stocksOwn || [];

            // Filter stocksOwn based on the stockSymbol
            const stocksToSell = stocksOwn.filter(stock => stock.symbol === stockSymbol);

            // Check if there are stocks with the specified symbol
            if (stocksToSell.length === 0) {
                return res.status(400).json({ error: 'No stocks found with the specified symbol.' });
            }

            // Assuming you want to calculate the average cost for the first stock with the specified symbol
            const avgCost = stocksToSell[0].avgCost;

            // Calculate the total earnings from the sale
            const totalReturn = stockPrice - avgCost;

            // Assuming you want to update the first stock with the specified symbol
            const stockToSell = stocksToSell[0];
            const remainingSharesToSell = stockToSell.shares - sharesToSell;

            // Send an error response if there are insufficient shares to sell
            if (remainingSharesToSell < 0) {
                return res.status(400).json({ error: 'Insufficient shares to sell.' });
            }

            // Deduct the total cost for the sold shares from the user's totalCost
            stockToSell.totalCost -= avgCost * sharesToSell;
            stockToSell.shares -= sharesToSell;
            stockToSell.avgCost = avgCost;

            // Update the user document with the modified stocksOwn, totalCost, and return
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $set: { stocksOwn },
                    $inc: { return: totalReturn }, // Increment return by totalReturn
                }
            );

            // Send a success response
            return res.status(200).json({ success: 'Stocks sold successfully.', totalEarnings: totalReturn });
        } catch (error) {
            // Send an error response with details
            console.error(error);
            res.status(500).json({ error: 'Internal server error.', details: error.message });
        }
    });

    app.get('/getLeaderboard', async (req, res) => {
        const { userId } = req.query; // Use query parameters for GET requests
        try {
            // Fetch user data from the database based on the user ID
            const userData = await usersCollection.findOne({ _id: ObjectId(userId) });
    
            // Check if the user exists
            if (!userData) {
                return res.status(404).json({ error: 'User not found.' });
            }
    
            const currentUser = userData.username;
            const allUsersData = await usersCollection.find().toArray();
            const sortedUsers = allUsersData.sort((a, b) => b.return - a.return);
    
            // Assign ranks to users based on their position in the sorted array
            const leaderboardData = sortedUsers.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                score: user.return,
            }));
    
            // Find the rank of the current user
            const currentUserRank = leaderboardData.findIndex(user => user.username === currentUser) + 1;
    
            // Send the ranked leaderboard data along with the current user's rank
            res.json({ leaderboard: leaderboardData, currentUserRank });
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });

    app.get('/getLeaderboard', async (req, res) => {
        const { userId } = req.query; // Use query parameters for GET requests
        try {
            // Fetch user data from the database based on the user ID
            const userData = await usersCollection.findOne({ _id: ObjectId(userId) });
    
            // Check if the user exists
            if (!userData) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const currentUserStockCurrency = userData.stockCurrency;

            // Send the user's stockCurrency
            res.json({ stockCurrency: currentUserStockCurrency });
        } catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Internal server error.' });
    }
    });

    app.post('/terminateAccount', async (req, res) => {
        const { userId } = req.body;
    
        try {
            // Fetch user data from the database based on the user ID
            const userData = await usersCollection.findOne({ _id: ObjectId(userId) });
    
            // Check if the user exists
            if (!userData) {
                return res.status(404).json({ error: 'User not found.' });
            }
    
            // Delete the specified fields from the user data
            await usersCollection.updateOne(
                { _id: ObjectId(userId) },
                {
                    $unset: {
                        stockCurrency: 1,
                        UnReturn: 1,
                        dayReturn: 1,
                        return: 1,
                        stockValue: 1,
                        totalCost: 1,
                        buyStocks: 1,
                        stocksOwn: 1,
                    },
                }
            );
    
            res.json({ success: true });
        } catch (error) {
            console.error('Error terminating account:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });
    
    app.post('/updateLastLogin', async (req, res) => {
        const { userId } = req.body;

        // Update the last login date for the user in your database
        await usersCollection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { lastLogin: new Date() }, $inc: { stockCurrency: 200 } }
        );
    
        res.json({ success: true });
    });
    
    app.get('/getLastLogin', async (req, res) => {
        const { userId } = req.query;
    
        // Fetch the last login date for the user from your database
        const userData = await usersCollection.findOne({ _id: ObjectId(userId) });
    
        // Send the last login date to the client
        res.json({ lastLogin: userData.lastLogin });
    });
  

    // Start the server
    app.listen(port, () => {
        console.log(`Server is running and listening at http://localhost:${port}`);
    });

    // Close the MongoDB client when the application is shutting down
    process.on('SIGINT', () => {
        client.close();
        process.exit();
    });
});


