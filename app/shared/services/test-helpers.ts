import { sql } from "@elements/app";

/**
 * A user for a test, with a cheap hash since nothing here tests bcrypt cost.
 * The email gets a random suffix so test files running in parallel never
 * insert the same unique email.
 */
export function makeUser(email: string, name: string = email.split("@")[0]): { id: string; name: string } {
  let unique = email.replace("@", `+${crypto.randomUUID().slice(0, 8)}@`);

  return sql<{ id: string; name: string }>(`
    insert into users (email, name, passwordHash)
         values (${unique}, ${name}, crypt('password1', genSalt('bf', 4)))
      returning id, name
  `).firstOrThrow();
}
