import { decode } from "jsonwebtoken";

const mockJWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const authorizationHeader = {
  authorization: `Bearer ${mockJWT}`,
};

export function GET({ path, context, headers = authorizationHeader }) {
  context.visits ??= {};

  context.visits[path.name] ??= 0;

  context.visits[path.name] += 1;

  if (!headers.authorization) {
    return {
      status: 401,
    };
  }

  const { authorization } = headers;

  const [, token] = authorization.split(" ");

  const result = decode(token);

  return {
    body: result,
  };
}
