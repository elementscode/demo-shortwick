import { sql } from "@elements/app";

/** A user for a test, with a cheap hash since nothing here tests bcrypt cost. */
export function makeUser(email: string, name: string = email.split("@")[0]): { id: string; name: string } {
  return sql<{ id: string; name: string }>(`
    insert into users (email, name, passwordHash)
         values (${email}, ${name}, crypt('password1', genSalt('bf', 4)))
      returning id, name
  `).firstOrThrow();
}
