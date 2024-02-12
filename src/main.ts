#!/usr/bin/env node

import { KeepassXCConnection } from "./KeepassXCConnection.js";
import { Configuration } from "./Configuration.js";
import { associate } from "./associate.js";
import { Command } from "commander";

(async function() {

const config = new Configuration();
await config.load();

const program = new Command();
program.version("1.0.0");

let operation: () => Promise<string>

let connection: KeepassXCConnection
async function getEntries(url: string) {
  const logins = await connection.getLogins(url);

  if (logins.length === 0) {
    throw new Error("No entries found for URL.");
  }

  return logins;
}

function getLogin(url: string) {
  return async function() {
    return (await getEntries(url))[0].login;
  }
}

function getPassword(url: string) {
  return async function() {
    return (await getEntries(url))[0].password;
  }
}

function getAll(url: string) {
  return async function() {
    const entry = (await getEntries(url))[0]
    return JSON.stringify({
      login: entry.login,
      password: entry.password
    });
  }
}

program.command("get-login <url>")
  .description("Gets the login name for the specified URL.")
  .action((url) => { operation = getLogin(url) });
program.command("get-pw <url>")
  .description("Gets the password for the specified URL.")
  .action((url) => { operation = getPassword(url) });

program.command("get <url>")
  .description("Gets login name and password for the specified URL.")
  .action((url) => { operation = getAll(url) });

try {
  program.parse();

  if (!operation) {
    throw new Error("No command specified!");
  }

  connection = await KeepassXCConnection.create();
  await associate(config, connection);

  console.log(await operation())
} catch(ex) {
  console.error(ex);
  process.exit(1);
} finally {
  connection.disconnect();
  await config.save();

  process.exit(0)
}

})()
