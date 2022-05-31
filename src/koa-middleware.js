export function koaMiddleware(dispatcher) {
  return async function middleware(ctx) {
    const { method, path, body, query } = ctx.request;

    const response = await dispatcher.request({
      method,
      path,
      body,
      query,
    });

    ctx.body = response.body;
    ctx.status = 200;
  };
}
