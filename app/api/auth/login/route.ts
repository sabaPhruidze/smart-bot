import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const US_PHONE_REGEX = /^\d{3}-\d{3}-\d{4}$/;

type UserRow = {
  id: string;
  password_hash: string;
  first_name: string;
  last_name: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const identifier = String(body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");

    const isEmail = EMAIL_REGEX.test(identifier);
    const isPhone = US_PHONE_REGEX.test(identifier);

    if (!identifier || !password || (!isEmail && !isPhone)) {
      return Response.json(
        { ok: false, error: "Please enter a valid email/phone and password." },
        { status: 400 }
      );
    }

    const rows = isEmail
      ? ((await sql`
          SELECT id, password_hash, first_name, last_name
          FROM users
          WHERE email = ${identifier}
          LIMIT 1
        `) as UserRow[])
      : ((await sql`
          SELECT id, password_hash, first_name, last_name
          FROM users
          WHERE phone = ${identifier}
          LIMIT 1
        `) as UserRow[]);

    // არ იპოვა user
    if (!rows || rows.length === 0) {
      return Response.json(
        {
          ok: false,
          error:
            "The email/phone or password you entered is incorrect. Please try again.",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    // პაროლის შემოწმება bcrypt-ით
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return Response.json(
        {
          ok: false,
          error:
            "The email/phone or password you entered is incorrect. Please try again.",
        },
        { status: 401 }
      );
    }

    const displayName = `${user.first_name} ${user.last_name}`.trim();

    return Response.json({
      ok: true,
      user: { id: user.id, displayName },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "We couldn’t sign you in right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
