import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

console.log('--- NEO4J CONNECTION DEBUG ---');
console.log('URI:', uri);
console.log('USER:', user);
console.log('PASSWORD LENGTH:', password ? password.length : 0);
console.log('------------------------------');

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export const getNeo4jSession = () => {
  return driver.session();
};

export const closeNeo4jDriver = async () => {
  await driver.close();
};

export default driver;
