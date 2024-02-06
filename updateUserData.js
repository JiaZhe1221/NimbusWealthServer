const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');


// Connection URI
const uri = 'mongodb+srv://user123:SkyStudios5757@skystudios.rjfe3hg.mongodb.net/NimbusWealth';

// Function to fetch real-time stock prices from Finnhub API
async function fetchRealTimeStockPrices(symbols) {
    const apiKey = 'cmu8s39r01qsv99m4llgcmu8s39r01qsv99m4lm0';
    const apiUrl = 'https://finnhub.io/api/v1/quote';

    const stockPrices = {};

    for (const symbol of symbols) {
        const url = `${apiUrl}?symbol=${symbol}&token=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.c) {
            stockPrices[symbol] = data.c;
        } else {
            stockPrices[symbol] = 0;
        }
    }

    return stockPrices;
}

// Function to calculate total unrealized return
async function calculateTotalUnrealizedReturn(userData) {
    const stocksOwn = userData.stocksOwn;

    if (!stocksOwn || stocksOwn.length === 0) {
        return 0; // If no stocks owned, unrealized return is 0
    }

    // Fetch real-time stock prices for symbols in stocksOwn
    const symbols = stocksOwn.map(stock => stock.symbol);
    const stockPrices = await fetchRealTimeStockPrices(symbols);


    // Calculate total unrealized return for all stocks
    const totalUnrealizedReturn = stocksOwn.reduce((total, stock) => {
        const currentStockPrice = stockPrices[stock.symbol];
        const unrealizedReturn = (currentStockPrice - stock.avgCost) * stock.shares;
        return total + unrealizedReturn;
    }, 0);
    return totalUnrealizedReturn;
}

// Connect to the MongoDB server
MongoClient.connect(uri, async (err, client) => {
    if (err) throw err;

    try {
        // Access the databases
        const db = client.db('NimbusWealth');

        // Access the users collection
        const usersCollection = db.collection('testing');

        // Retrieve all users
        const users = await usersCollection.find({}).toArray();

        // Update unrealized return for each user
        for (const user of users) {
            const unrealizedReturns = user.UnReturn;
            const totalDailyReturn = user.dayReturn;

            if(!totalDailyReturn) {
                // If the user does not have it, create one
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { dayReturn: {} }
                    }
                );
            }

            if (!unrealizedReturns) {
                // If the user does not have it, create one
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { UnReturn: {} }
                    }
                );
            }

            const unrealizedReturn = await calculateTotalUnrealizedReturn(user);
            const todayDate = new Date().toISOString().split('T')[0];
    

            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: { UnReturn: { [todayDate]: unrealizedReturn } }
                }
            );

            const totalReturn = user.return;
            const dayReturns = user.dayReturn || {};
            // Check if the user has a daily return for today
            if (!dayReturns[todayDate]) {
                // Calculate the daily return (you need to define this calculation based on your business logic)
                const dailyReturn = totalReturn;
            
                // Update the dayReturn field with the daily return for today
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: { [`dayReturn.${todayDate}`]: dailyReturn }
                    }
                );
            }


        }

        console.log('Unrealized return updated successfully.');
    } catch (error) {
        console.error('Error updating unrealized return:', error);
    } finally {
        // Close the MongoDB client
        client.close();
    }
});