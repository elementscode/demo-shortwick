import { sql, session, AuthError, SqlError } from "@elements/app";

export const MIN_PASSWORD = 8;

/** The seeded accounts, shown on the sign-in page so a visitor can look around. */
export const DEMO_LOGINS = [
  { name: "Ada Lovelace", email: "ada@shortwick.test", password: "shortwick-demo" },
  { name: "Grace Hopper", email: "grace@shortwick.test", password: "shortwick-demo" },
];

interface User {
  id: string;
  name: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("enter your email and password");
  }

  let user = sql<User>(`
    select id, name from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("invalid email or password");
  }

  session.login({ userId: user.id, userName: user.name });
}

/** @rpc */
export function signup(name: string, email: string, password: string) {
  let address = normalizeEmail(email);
  let displayName = name.trim() || address.split("@")[0];

  if (!isEmail(address)) {
    throw new AuthError("enter a valid email address");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`password must be at least ${MIN_PASSWORD} characters`);
  }

  let user: User;

  try {
    user = sql<User>(`
      insert into users (email, name, passwordHash)
           values (${address}, ${displayName}, crypt(${password}, genSalt('bf', 12)))
        returning id, name
    `).firstOrThrow();
  } catch (err) {
    if (err instanceof SqlError) {
      throw new AuthError("that email is already registered");
    }

    throw err;
  }

  session.login({ userId: user.id, userName: user.name });
}

/** @rpc */
export function signout() {
  session.logout();
}
