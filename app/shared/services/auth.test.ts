import { test, assert, equal, session, sql, AuthError } from "@elements/app";
import { signin, signup } from "./auth";

async function authError(fn: () => void | Promise<void>): Promise<string> {
  try {
    await fn();
  } catch (err: any) {
    assert(err instanceof AuthError, `got ${err}`);
    return err.message;
  }

  return "";
}

test("auth", () => {
  test("signup stores a lowercased email and signs in", () => {
    signup("Ada", " Ada@Example.com ", "longenough");

    equal(sql(`select email from users where email = 'ada@example.com'`).firstOrThrow().email, "ada@example.com");
    equal(session.get("userName"), "Ada");
  });

  test("signup refuses a duplicate and a short password", async () => {
    signup("Ada", "ada@example.com", "longenough");

    equal(await authError(() => signup("Ada", "ADA@example.com", "longenough")), "that email is already registered");
    equal(await authError(() => signup("Bo", "bo@example.com", "short")), "password must be at least 8 characters");
  });

  test("signin checks the password", async () => {
    signup("Ada", "ada@example.com", "longenough");
    session.logout();

    equal(await authError(() => signin("ada@example.com", "wrong-password")), "invalid email or password");

    signin("ADA@example.com", "longenough");
    equal(session.isLoggedIn(), true);
  });
});
