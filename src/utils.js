
export function stringifyRequest (loaderContext, request) {
  const splitRequest = request.split("!");
  const context = loaderContext.context || (loaderContext.options && loaderContext.options.context);
  return JSON.stringify(splitRequest.map(function(part) {
    if(/^\/|^[A-Z]:/i.test(part) && context) {
      part = path.relative(context, part);
      if(/^[A-Z]:/i.test(part)) {
        return part;
      } else {
        return "./" + part.replace(/\\/g, "/");
      }
    }
    return part;
  }).join("!"));
}
