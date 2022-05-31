export function koaMiddleware(dispatcher) {
  return async function middleware(ctx) {
    const { method, path, body } = ctx.request;
    const response = await dispatcher.request({
      method,
      path,
      body,
    });

    ctx.body = response.body;
    ctx.status = 200;
  };
}
