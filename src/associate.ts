import { Configuration } from "Configuration.js";
import { KeepassXCConnection } from "KeepassXCConnection.js";

export async function associate(config: Configuration, connection: KeepassXCConnection) {
  const dbHash = await connection.getDatabaseHash();

  // If we do not know this database yet or if the associate test fails, associate again
  if (!config.hasKey(dbHash) || !await connection.testAssociate(config.getKey(dbHash).id,
    config.getKey(dbHash).idKey)) {
    const associateRes = await connection.associate();

    config.saveKey(associateRes.dbHash, {
      id: associateRes.id,
      idKey: associateRes.idKey
    });
  }
}