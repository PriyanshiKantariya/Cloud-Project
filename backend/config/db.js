const { CosmosClient } = require("@azure/cosmos");
require("dotenv").config();

const endpoint = process.env.COSMOSDB_URI;
const key = process.env.COSMOSDB_KEY;
const databaseId = process.env.COSMOSDB_DATABASE;
const containerId = process.env.COSMOSDB_CONTAINER;

const client = new CosmosClient({ endpoint, key });

async function getDatabase() {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    return database;
}

async function getContainer() {
    const database = await getDatabase();
    const { container } = await database.containers.createIfNotExists({ id: containerId });
    return container;
}

module.exports = { getContainer };
